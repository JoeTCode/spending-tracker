import { NavBar, EditableGrid } from '../components';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useRef, useState, useEffect } from 'react';
// import { updateTransactions, getTransactions, deleteTransaction } from '../api/transactions';
import { CATEGORY_TO_EMOJI } from '../utils/constants/constants';
import { getClientModel, saveClientModel } from '../utils/modelIO';
import { getModelWeights, weightAverage } from '../api/globalModel';
import { train, predict, accuracy, getDeltas, getBufferFromWeights } from '../utils/model';
import { getTransactions, updateTransaction, deleteTransaction } from '../db/db';

const CATEGORIES = ["Groceries", "Housing & Bills", "Finance & Fees", "Transport", "Income", "Shopping", "Eating Out", "Entertainment", "Health & Fitness", "Other / Misc"]
const CATEGORIES_SET = new Set(CATEGORIES);
const CORRECTIONSTRIGGER = 10;
const UNDO_REDO_DELAY = 500;

// customise column format and functions for the EditableGrid cols argument
const formatHeaders = (headers, token) => {
    const deleteRowName = 'Delete';
    headers = headers.map(header => CATEGORY_TO_EMOJI[header] || header);
    const headersCopy = [...headers, deleteRowName];
    const formatted = []
    

    for (const header of headersCopy) {
        const obj = {}
        if (header === '_id') {
            continue;
        }
        else if (header === 'amount') {
            obj['field'] = header
            obj['editable'] = true;
            obj['valueParser'] = params => {
                const value = parseFloat(params.newValue);
                if (isNaN(value)) return params.oldValue; // reject invalid input
                return value;
            };
        }
        else if (header === 'category') {
            obj['field'] = header
            obj['editable'] = true;
            obj['cellEditor'] = 'agSelectCellEditor';
            obj['cellEditorParams'] = {
                values: CATEGORIES
            };
            obj['singleClickEdit'] = true;
            obj['valueFormatter'] = params => {
                return CATEGORY_TO_EMOJI[params.value] || params.value;
            };
        }
        else if (header === deleteRowName) {
            obj['field'] = header
            obj['width'] = 80
            obj['cellRenderer'] = (props) => {
                const deleteRow = async () => {
                    const deletedRow = props.api.applyTransaction({ remove: [props.data] })
                    await deleteTransaction(deletedRow.remove[0].data);
                };

                return (
                    <img
                        src="/circle-xmark-solid.svg"
                        alt="X"
                        onClick={deleteRow}
                        style={{
                            cursor: 'pointer',
                            width: '20px',
                            height: '20px',
                            filter: 'grayscale(100%)',
                            opacity: 0.7,
                            marginTop: '10px',
                            marginLeft: '11px'
                        }}
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
            };
        } 
        else {
            obj['field'] = header;
            obj['editable'] = true;
        };

        formatted.push(obj);
    };

    return formatted;
};

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
    const [ headers, setHeaders ] = useState([]);

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
            const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            // const data = await getTransactions(token, 'a');
            const data = await getTransactions('a');
            // console.log('test', test);
            console.log('actual', data);
            setTransactions(data);

            setRowData(data); // new

            const hdrs = Object.keys(data[0])
            setHeaders(formatHeaders(hdrs, token));
        };

        retrieveData();
    
    }, []);


    async function undo() {
        const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
        const undosPopped = [...undos];
        const mostRecentUndo = undosPopped.pop()

        gridRef.current.api.applyTransaction({
            update: [mostRecentUndo]
        });

        // cancel any existing timer
        if (timerId) clearTimeout(timerId);


        // add row state before undo to redo
        for (const row of rowData) {
            if (row._id === mostRecentUndo._id) {
                setRedos(prev => {
                    if (prev.length > 0) {
                        return [...prev, row];
                    } else return [row];
                });
            };
        }; 

        // start timer
        const id = setTimeout(async () => {
            // await updateTransactions(token, mostRecentUndo);
            await updateTransaction(mostRecentUndo);
            setTimerId(null);
        }, UNDO_REDO_DELAY);

        setTimerId(id);

        setRowData(prevRows => {
            return prevRows.map(row => row._id === mostRecentUndo._id ? mostRecentUndo : row);
        });
        setUndos(undosPopped);
    };

    async function redo() {
        const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
        const redosPopped = [...redos];
        const mostRecentRedo = redosPopped.pop();

        gridRef.current.api.applyTransaction({
            update: [mostRecentRedo]
        });

        if (timerId) clearTimeout(timerId);

        // add row state before redo to undo
        for (const row of rowData) {
            if (row._id === mostRecentRedo._id) {
                setUndos(prev => {
                    if (prev.length > 0) {
                        return [...prev, row];
                    } else return [row];
                });
            };
        };
        
        const id = setTimeout(async () => {
            const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            // await updateTransactions(token, mostRecentRedo);
            await updateTransaction(mostRecentRedo);
            setTimerId(null);
        }, UNDO_REDO_DELAY);

        setTimerId(id);

        setRowData(prevRows => {
            return prevRows.map(row => row._id === mostRecentRedo._id ? mostRecentRedo : row);
        });
        setRedos(redosPopped);
    };


    const handleCellChange = async (updatedRow, params) => {
        const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
        setRedos([]);

        const column = params.column.colId;

        if (column === 'Category') {
            if (CATEGORIES_SET.has(updatedRow[column])) {
                updatedRow['trained'] = false;
            };
        };

        try {
            // await updateTransactions(token, updatedRow); // undo redo wont trigger handleCellChange
            await updateTransaction(updatedRow);
            const column = params.column.colId;
            
            setUndos((prev) => {
                if (prev) {
                    return [...prev, {...updatedRow, [column]: params.oldValue}]
                } else {
                    return [{...updatedRow, [column]: params.oldValue}]
                };
            });
        } catch (err) {
            console.error(err);
        };
    };

    return (
        <>
            <NavBar />
            <h1>Transactions</h1>
            
            {rowData && rowData.length > 0 ? (
                <EditableGrid gridRef={gridRef} rowData={rowData} colNames={headers} onCellChange={handleCellChange} /> ) : null
            }

            {undos.length > 0 ? (
                <button onClick={async () => { await undo() }}> Undo </button> )  
                : ( <button disabled className='disabled-button'> Undo </button> )
            }

            {redos.length > 0 ? (
                <button onClick={async () => { await redo() }}> Redo </button>
            ) : ( <button disabled className='disabled-button'> Redo </button> )}

            <button onClick={async () => {
                const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
                const prevMonth = new Date()
                prevMonth.setMonth(selectedMonth - 1)
                // const prevTransactions = await getTransactions(token, 'vm', prevMonth.getMonth());

                const prevTransactions = await getTransactions('vm', prevMonth.getMonth());
                // console.log('test prev', prev)
                // console.log('actual prev', prevTransactions);

                setRowData(prevTransactions);
                setSelectedMonth(prev => {
                    return prev - 1;
                });
            }}>
                Prev
            </button>
            <button onClick={async () => {
                const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
                const nextMonth = new Date()
                nextMonth.setMonth(selectedMonth + 1)
                // const nextTransactions = await getTransactions(token, 'vm', nextMonth.getMonth());

                const nextTransactions = await getTransactions('vm', nextMonth.getMonth());
                // console.log('test prev', next)
                // console.log('actual prev', nextTransactions);

                setRowData(nextTransactions);
                setSelectedMonth(prev => {
                    return prev + 1;
                });
            }}>
                Next
            </button>
            <button onClick={async () => {
                const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
                // const allTransactions = await getTransactions(token, 'a');
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