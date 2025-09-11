import { NavBar, EditableGrid } from '../components';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useRef, useState, useEffect } from 'react';
// import { updateTransactions, getTransactions, deleteTransaction } from '../api/transactions';
import { CATEGORIES, CATEGORY_TO_EMOJI } from '../utils/constants/constants';
import { getClientModel, saveClientModel } from '../utils/modelIO';
import { getModelWeights, weightAverage } from '../api/globalModel';
import { train, predict, accuracy, getDeltas, getBufferFromWeights } from '../utils/model';
import { db, getTransactions, updateTransaction, deleteTransaction } from '../db/db';

const CATEGORIES_SET = new Set(CATEGORIES);
const CORRECTIONSTRIGGER = 10;
const UNDO_REDO_DELAY = 500;

// customise column format and functions for the EditableGrid cols argument
const createHeaders = (setUndos) => ([
    {
        field: "date",
        sort: "desc",
        editable: true,
        width: 110,
        headerClass: "font-bold"
    },
    {
        field: "description",
        editable: true,
        headerClass: "font-bold"
    },
    {
        field: "category",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: CATEGORIES },
        singleClickEdit: true,
        valueFormatter: params => CATEGORY_TO_EMOJI[params.value] || params.value,
        headerClass: "font-bold",
        width: 160
    },
    {
        field: "type",
        editable: true,
        headerClass: "font-bold",
    },
    {
        field: "amount",
        editable: true,
        valueParser: params => {
            const value = parseFloat(params.newValue);
            if (isNaN(value)) return params.oldValue; // reject invalid input
            return value;
        },
        width: 130,
        headerClass: "font-bold"
    },
    {
        field: "delete",
        width: 80,
        headerClass: "font-bold",
        cellRenderer: props => {
            const deleteRow = async () => {
                const deletedRow = props.api.applyTransaction({ remove: [props.data] })
                await deleteTransaction(deletedRow.remove[0].data);
                setUndos((prev) => {
                    if (prev) {
                        console.log(deletedRow)
                        return [...prev, { type: 'delete', row: deletedRow.remove[0].data, index: deletedRow.remove[0].sourceRowIndex }] // { {row_x}, {row_y}, {type: 'delete', row: {row_z}} }
                    } else {
                        return [{ type: 'delete', row: deletedRow.remove[0].data }]
                    };
                });
            };
            
            return (
                <img
                    src="/circle-xmark-solid.svg"
                    alt="X"
                    onClick={deleteRow}
                    className='cursor-pointer w-5 h-5 mt-3 ml-4'
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateY(1px)';
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.filter = 'none';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.filter = 'none';
                    }}
                />
            );
        }
    }
]);

const trainModel = async (transactions) => {
    const descriptions = [];
    const targets = [];
    for (let tx of transactions) {
        if (CATEGORIES_SET.has(tx['category'])) {
            descriptions.push(tx['description']);
            targets.push(tx['category']);
        };
    };

    const model = await getClientModel();
    const trainedModel = await train(model, descriptions, targets);
    const predictions = await predict(trainedModel, descriptions);
    console.log(accuracy(predictions, targets));
};

const testWeightAvg = async (transactions, token) => {
    const descriptions = [];
    const targets = [];
    for (let tx of transactions) {
        if (CATEGORIES_SET.has(tx['category'])) {
            descriptions.push(tx['description']);
            targets.push(tx['category']);
        };
    };
    const clientModel = await getClientModel(token);
    const globalModelWeights = await getModelWeights(token);
    const trainedModel = await train(clientModel, descriptions, targets);
    const weights = trainedModel.getWeights();
    // const weights = clientModel.getWeights();
    const deltas = getDeltas(weights, globalModelWeights);
    const [ buffer, shapes ] = await getBufferFromWeights(deltas);

    // post to weight averaging route
    await weightAverage(token, buffer, shapes);
    
    // get new model from db via api and save it to indexedDB clientside
    const newGlobalModelWeights = await getModelWeights(token);
    saveClientModel(newGlobalModelWeights);
};

const Transactions = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [ transactions, setTransactions ] = useState([]);
    // const [ headers, setHeaders ] = useState(headers);

    const [ rowData, setRowData ] = useState(null);
    const [ undos, setUndos ] = useState([]);
    const [ redos, setRedos ] = useState([]);
    const gridRef = useRef(null);
    const [timerId, setTimerId] = useState(null);
    const [ selectedMonth, setSelectedMonth ] = useState(new Date().getMonth());
    
    const [correctionsCount, setCorrectionsCount] = useState(() => {
        const saved = localStorage.getItem("count");
        if (saved === null) {
            localStorage.setItem("count", "0");
            return 0;
        }
        return parseInt(saved);
    });

    useEffect(() => {
        const testLogger = () => {
            console.log('undos', undos);
            console.log('redos', redos);
        };

        testLogger();
    }, [undos, redos]);

    // If user makes more than CORRECTIONSTRIGGER number of corrections to the grid, train model on any untrained 
    // corrected/not-corrected transactions and perform federated averaging with the global model
    // useEffect(() => {
    //     const executeWeightAverage = async (descriptions, categories) => {
    //             const clientModel = await getClientModel();
    //             const globalModelWeights = await getModelWeights();
    //             const trainedModel = await train(clientModel, descriptions, categories);
    //             const weights = trainedModel.getWeights();
    //             const deltas = getDeltas(weights, globalModelWeights);
    //             // post to weight averaging route
    //             const newWeights = await weightAverage(token, deltas);
    //             const avgModel = createModel();
    //             avgModel.setWeights(newWeights);

    //             const d = [];
    //             const t = [];
    //             for (let tx of transactions) {
    //                 if (CATEGORIES_SET.has(tx['category'])) {
    //                     d.push(tx['description']);
    //                     t.push(tx['category']);
    //                 };
    //             };

    //             const predictions = await predict(avgModel, t);
    //             console.log(accuracy(predictions, t));

    //     };

    //     if (correctionsCount >= CORRECTIONSTRIGGER) {
    //         const descriptions = corrections.map(correction => correction.description);
    //         const categories = corrections.map(correction => correction.category);
            
    //         executeWeightAverage(descriptions, categories);
    //         // const model = saveClientModel(newModelWeights);
    //         // setClientModel(model);
    //     };

    // }, [correctionsCount])
    
    useEffect(() => {
        const retrieveData = async () => {
            const data = await getTransactions('a');
            setTransactions(data);

            setRowData(data); // new
        };

        retrieveData();
    
    }, []);

    async function undo() {
        const undosPopped = [...undos];
        const action = undosPopped.pop();
        if (!action) return;

        if (action.type === 'delete') {
            gridRef.current.api.applyTransaction({ add: [action.row] });
            setRedos(prev => [...prev, action]);
        }
        else {
            gridRef.current.api.applyTransaction({ update: [action.before] });
            setRedos(prev => [...prev, action]);
        };

        if (timerId) clearTimeout(timerId);
        // start timer
        const id = setTimeout(async () => {
            if (action.type === 'delete') await db.barclaysTransactions.add(action.row);
            else await updateTransaction(action.before);
            setTimerId(null);
        }, UNDO_REDO_DELAY);

        setTimerId(id);
        setUndos(undosPopped);
    }

    async function redo() {
        const redosPopped = [...redos];
        const action = redosPopped.pop();
        if (!action) return;

        if (action.type === 'delete') {
            gridRef.current.api.applyTransaction({ remove: [action.row] });
            setUndos(prev => [...prev, action]);
        }
        else {
            gridRef.current.api.applyTransaction({ update: [action.after] });
            setUndos(prev => [...prev, action]);
        };

        if (timerId) clearTimeout(timerId);
        // start timer
        const id = setTimeout(async () => {
            if (action.type === 'delete') await db.barclaysTransactions.delete(action.row._id);
            else await updateTransaction(action.after);
            setTimerId(null);
        }, UNDO_REDO_DELAY);

        setTimerId(id);
        setRedos(redosPopped)
    }

    const handleCellChange = async (updatedRow, params) => {
        setRedos([]);
        const column = params.column.colId;

        if (column === 'Category') {
            if (CATEGORIES_SET.has(updatedRow[column])) {
                updatedRow['trained'] = false;
            };
        };

        try {
            await updateTransaction(updatedRow);
            const column = params.column.colId; // name of column changed
            
            setUndos((prev) => {
                if (prev) {
                    return [...prev, { type: "edit", before: {...updatedRow, [column]: params.oldValue}, after: { ...updatedRow } }];
                } else {
                    return [{ type: "edit", before: {...updatedRow, [column]: params.oldValue}, after: { ...updatedRow } }];
                };
            });
        } catch (err) {
            console.error(err);
        };
    };

    return (
        <>
            <NavBar />
            <div className='flex justify-center w-full mt-40'>
                {rowData && rowData.length > 0 ? ( <div className='h-150 w-220'>
                    <EditableGrid gridRef={gridRef} rowData={rowData} colNames={createHeaders(setUndos)} onCellChange={handleCellChange} />
                    </div>) : null
                }
            </div>
            {undos.length > 0 ? (
                <button onClick={async () => { await undo() }}> Undo </button> )  
                : ( <button disabled className='disabled-button'> Undo </button> )
            }

            {redos.length > 0 ? (
                <button onClick={async () => { await redo() }}> Redo </button>
            ) : ( <button disabled className='disabled-button'> Redo </button> )}

            <button onClick={async () => {
                const prevMonth = new Date()
                prevMonth.setMonth(selectedMonth - 1)

                const prevTransactions = await getTransactions('vm', prevMonth.getMonth());

                setRowData(prevTransactions);
                setSelectedMonth(prev => {
                    return prev - 1;
                });
            }}>
                Prev
            </button>

            <button onClick={async () => {
                const nextMonth = new Date()
                nextMonth.setMonth(selectedMonth + 1)

                const nextTransactions = await getTransactions('vm', nextMonth.getMonth());

                setRowData(nextTransactions);
                setSelectedMonth(prev => {
                    return prev + 1;
                });
            }}>
                Next
            </button>

            <button onClick={async () => {
                const allTransactions = await getTransactions('a');
                setRowData(allTransactions);
            }}>
                All
            </button>

            {/* User can manually train corrected/added transactions, this will set a trained flag to true for each
            row in thwe grid that is trained, this will NOT execute model averaging with the global model. */}
            <button onClick={() => trainModel(rowData)}>Train</button>

            <button onClick={async () => {
                const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
                testWeightAvg(rowData, token);
            }}>
                Test Weight Average
            </button>
        </>
    )
}

export default Transactions