import { NavBar, EditableGrid } from '../components';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useRef, useState, useEffect } from 'react';
import { CATEGORIES, CATEGORY_TO_EMOJI, MONTHS } from '../utils/constants/constants';
import { db, getTransactions, updateTransaction, deleteTransaction } from '../db/db';
import { trainModel } from '../api/model';
import Trash from '../assets/icons/trash-svgrepo-com.svg?react';
import UndoLeft from '../assets/icons/undo-left-round-svgrepo-com.svg?react'
import UndoRight from '../assets/icons/undo-right-round-svgrepo-com.svg?react';
import ChevronLeft from '../assets/icons/chevron-left-svgrepo-com.svg?react';
import ChevronRight from '../assets/icons/chevron-right-svgrepo-com.svg?react';
import DateRange from '../assets/icons/date-range-svgrepo-com.svg?react';

const CATEGORIES_SET = new Set(CATEGORIES);
const CORRECTIONSTRIGGER = 10;
const UNDO_REDO_DELAY = 500;

// customise column format and functions for the EditableGrid cols argument
const createHeaders = (setUndos) => ([
    {
        field: "date",
        sort: "desc",
        editable: true,
        width: 120,
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
        // valueFormatter: params => CATEGORY_TO_EMOJI[params.value] || params.value,
        headerClass: "font-bold",
        width: 170,
        cellRenderer: params => {
            return <span className='bg-stone-700 rounded-lg py-1 px-2'>{CATEGORY_TO_EMOJI[params.value] || params.value}</span>
        }
    },
    {
        field: "type",
        editable: true,
        headerClass: "font-bold",
        width: 120
    },
    {
        field: "amount",
        editable: true,
        // valueParser: params => {
        //     const value = parseFloat(params.newValue);
        //     if (isNaN(value)) return params.oldValue; // reject invalid input
        //     return value;
        // },
        width: 130,
        headerClass: "font-bold",
        cellRenderer: params => {
            if (params.value < 0) {
                return <span className=' text-red-500'>{params.value.toFixed(2)}</span>
            }
            else {
                return <span className=' text-green-500'>+{params.value.toFixed(2)}</span>
            }   
        }
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
                <Trash onClick={deleteRow} className='cursor-pointer w-5 h-5 mt-2 ml-3 hover:text-gray-300' />
            );
        }
    }
]);

const Undo = ({ undos, undo }) => (
  <button 
    onClick={undos.length > 0 ? undo : undefined} 
    disabled={undos.length === 0} 
    className={undos.length === 0 ? 
        "w-20 flex items-center bg-gray-600 rounded-lg m-1 p-1 shadow-lg cursor-not-allowed text-sm gap-2 h-8 opacity-50" : 
        'w-20 flex items-center bg-[#141212] rounded-lg m-1 p-1 shadow-lg cursor-pointer hover:bg-black text-sm gap-2 h-8'}
  >
    <UndoLeft className='w-5 h-5 relative top-[1px]' />
    <span>Undo</span>
  </button>
);

const Redo = ({ redos, redo }) => (
  <button 
    onClick={redos.length > 0 ? redo : undefined} 
    disabled={redos.length === 0} 
    className={redos.length === 0 ? 
        "w-20 flex items-center bg-gray-600 rounded-lg m-1 p-1 shadow-lg cursor-not-allowed text-sm gap-2 h-8 opacity-50" : 
        'w-20 flex items-center bg-[#141212] rounded-lg m-1 p-1 shadow-lg cursor-pointer hover:bg-black text-sm gap-2 h-8'}
  >
    <UndoRight className='w-5 h-5 relative top-[1px]' />
    Redo
  </button>
);

const Prev = ({ setUndos, setRedos, selectedTimeframe, getTransactions, rowData, setRowData, setSelectedTimeframe, setIsFilteredByAll, transactionsDateRange }) => {
    const prevMonth = new Date(selectedTimeframe);
    prevMonth.setMonth(prevMonth.getMonth() - 1)

    if (rowData.length === 0 || prevMonth.getTime() < new Date(transactionsDateRange.min).getTime()) {
        return (
            <button
                className="flex items-center gap-1 bg-gray-600 rounded-lg m-1 p-1 pr-3 shadow-lg cursor-not-allowed text-sm h-8 opacity-50"
                disabled={true}
            >
                <ChevronLeft className='h-5 w-5 relative top-[1px]'/>
                <span>Previous</span>
            </button>
        ) 
    }
    
    else return (
        <button 
            onClick={async () => {
                setUndos([]);
                setRedos([]);

                console.log('PREV', prevMonth);
                const prevTransactions = await getTransactions({ rangeType: 'vm', selectedMonth: prevMonth.getMonth(), selectedYear: prevMonth.getFullYear() });
                
                setRowData(prevTransactions);
                setSelectedTimeframe(prev => {
                    const dateObj = new Date(prev);
                    return dateObj.setMonth(dateObj.getMonth() - 1);
                });
                setIsFilteredByAll(false);
            }}
            className='flex items-center gap-1 bg-[#141212] rounded-lg m-1 p-1 pr-3 shadow-lg cursor-pointer hover:bg-black text-sm h-8'
        >
            <ChevronLeft className='h-5 w-5 relative top-[1px]'/>
            <span>Previous</span>
        </button>
    )
};

const Next = ({ setUndos, setRedos, selectedTimeframe, getTransactions, rowData, setRowData, setSelectedTimeframe, setIsFilteredByAll, transactionsDateRange }) => {
    const nextMonth = new Date(selectedTimeframe);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (rowData.length === 0 || nextMonth.getTime() > new Date(transactionsDateRange.max).getTime()) {
        return (
            <button
                className="flex items-center gap-1 bg-gray-600 rounded-lg m-1 p-1 shadow-lg cursor-not-allowed text-sm h-8 opacity-50"
                disabled={true}
            >
                <span>Next</span>
                <ChevronRight className='h-5 w-5 relative top-[1px]'/>
            </button>
        ) 
    }
    else {
        return (
            <button 
                onClick={async () => {
                    setUndos([]);
                    setRedos([]);
                    
                    console.log('NEXT', nextMonth);
                    const nextTransactions = await getTransactions({ rangeType:'vm', selectedMonth: nextMonth.getMonth(), selectedYear: nextMonth.getFullYear() });
                    setRowData(nextTransactions);
                    setSelectedTimeframe(prev => {
                        const dateObj = new Date(prev);
                        return dateObj.setMonth(dateObj.getMonth() + 1);
                    });
                    setIsFilteredByAll(false);
                }}
                className='flex items-center gap-1 bg-[#141212] rounded-lg m-1 p-1 shadow-lg cursor-pointer hover:bg-black text-sm h-8'
            >
                <span className=''>Next</span>
                <ChevronRight className='h-5 w-5 relative top-[1px]'/>
            </button>
        );
    }
    
};

const All = ({ setUndos, setRedos, getTransactions, setRowData, isFilteredByAll, setIsFilteredByAll, setSelectedTimeframe, latestTransaction }) => (
    <button 
        onClick={
            isFilteredByAll ? 
            (undefined) : (
            async () => {
                setUndos([]);
                setRedos([]);
                setSelectedTimeframe(new Date(latestTransaction));
                const allTransactions = await getTransactions({ rangeType: 'a' });
                console.log(latestTransaction);
                setRowData(allTransactions);
                setIsFilteredByAll(true);
            })
        }
        disabled={isFilteredByAll}
        className={isFilteredByAll ? 'bg-gray-600 rounded-lg m-1 p-1 pl-3 pr-3 shadow-lg cursor-not-allowed text-sm h-8 opacity-50' :
            'bg-[#141212] rounded-lg m-1 p-1 pl-3 pr-3 shadow-lg cursor-pointer hover:bg-black text-sm h-8'}
    >
        All
    </button>
);
// flex items-center gap-1 bg-gray-600 rounded-lg m-1 p-1 pr-3 shadow-lg cursor-not-allowed text-sm h-8 opacity-50
const Transactions = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [ transactions, setTransactions ] = useState([]);
    const [ rowData, setRowData ] = useState([]);
    const [ undos, setUndos ] = useState([]);
    const [ redos, setRedos ] = useState([]);
    const gridRef = useRef(null);
    const [timerId, setTimerId] = useState(null);
    const [ selectedTimeframe, setSelectedTimeframe ] = useState(new Date()); // gets reassigned upon initial tx retrieval
    const [ isFilteredByAll, setIsFilteredByAll ] = useState(true);
    const [ transactionsDateRange, setTransactionsDateRange ] = useState({ min: null, max:null });
    const [ latestTransaction, setLatestTransaction ] = useState(null);
    const [correctionsCount, setCorrectionsCount] = useState(() => {
        const saved = localStorage.getItem("count");
        if (saved === null) {
            localStorage.setItem("count", "0");
            return 0;
        }
        return parseInt(saved);
    });

    // useEffect(() => {
    //     const testLogger = () => {
    //         console.log('undos', undos);
    //         console.log('redos', redos);
    //     };

    //     testLogger();
    // }, [undos, redos]);

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
            const data = await getTransactions({ rangeType: 'a', sorted: 'desc' });
            if (data.length === 0) return;

            setTransactions(data);

            let latest = new Date(data[0].date);
            let earliest = new Date(data[data.length - 1].date);
            if (isNaN(latest.getTime())) latest = new Date();
            if (isNaN(earliest.getTime())) earliest = new Date();
            setSelectedTimeframe(latest);
            setLatestTransaction(latest);
            earliest.setHours(0, 0, 0, 0);
            earliest.setDate(1);

            latest.setHours(23, 59, 59, 999);
            latest.setDate(1);
            latest.setMonth(latest.getMonth() + 1)
            latest.setDate(latest.getDate() - 1)
            setTransactionsDateRange({min: earliest, max: latest});
            console.log({min: earliest, max: latest})

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
            <div className='flex justify-center w-full mt-40 mb-10'>
                <div className='bg-[#1a1818] min-w-[905px] shadow-lg rounded-lg p-10 pt-10'>
                    <div className='flex justify-between'>
                        {isFilteredByAll ?
                            <div className='flex ml-2 items-center mb-5'>
                                <DateRange className='h-5 w-5' />
                                <h2 className='text-gray-300 ml-2'>
                                    All Transactions
                                </h2>
                            </div> : 
                            <div className='flex ml-2 items-center mb-5'>
                                <DateRange className='h-5 w-5' />
                                <h2 className='text-gray-300 ml-2'>
                                    {MONTHS[new Date(selectedTimeframe).getMonth()]} {new Date(selectedTimeframe).getFullYear()}
                                </h2>
                            </div>
                        }
                        <div className='flex'>
                            {/* User can manually train corrected/added transactions, this will set a trained flag to true for each
                            row in thwe grid that is trained, this will NOT execute model averaging with the global model. */}
                            <button 
                                onClick={
                                    rowData.length === 0 ? undefined : 
                                        () => {
                                            const descriptions = [];
                                            const targets = [];
                                            for (let tx of rowData) {
                                                if (CATEGORIES_SET.has(tx['category'])) {
                                                    descriptions.push(tx['description']);
                                                    targets.push(tx['category']);
                                                };
                                            };
                                            trainModel(descriptions, targets);
                                        }}
                                className={rowData.length === 0 ? 
                                    'bg-gray-600 rounded-lg m-1 p-1 pl-3 pr-3 shadow-lg cursor-not-allowed text-sm h-8 opacity-50' :
                                    'bg-[#141212] rounded-lg m-1 p-1 pl-3 pr-3 shadow-lg cursor-pointer hover:bg-black text-sm h-8'
                                }
                                disabled={rowData.length === 0}
                            > 
                                Train
                            </button>
                        </div>
                    </div>
                    
                    <div className='flex justify-between mb-3'>
                        <div className='flex'>
                            <Prev 
                                setUndos={setUndos} setRedos={setRedos} selectedTimeframe={new Date(selectedTimeframe)} getTransactions={getTransactions}
                                rowData={rowData} setRowData={setRowData} setSelectedTimeframe={setSelectedTimeframe} setIsFilteredByAll={setIsFilteredByAll}
                                transactionsDateRange={transactionsDateRange} 
                            />
                            <Next 
                                setUndos={setUndos} setRedos={setRedos} selectedTimeframe={new Date(selectedTimeframe)} getTransactions={getTransactions}
                                rowData={rowData} setRowData={setRowData} setSelectedTimeframe={setSelectedTimeframe} setIsFilteredByAll={setIsFilteredByAll}
                                transactionsDateRange={transactionsDateRange}
                            />
                            <All 
                                setUndos={setUndos} setRedos={setRedos} getTransactions={getTransactions} setRowData={setRowData}
                                isFilteredByAll={isFilteredByAll} setIsFilteredByAll={setIsFilteredByAll} setSelectedTimeframe={setSelectedTimeframe}
                                latestTransaction={latestTransaction}
                            />
                        </div>
                        <div className='flex'>
                            <Undo undos={undos} undo={undo} />
                            <Redo redos={redos} redo={redo} />
                        </div>
                    </div>

                    {rowData && rowData.length > 0 ? ( <div className='h-170 w-206'>
                        <EditableGrid gridRef={gridRef} rowData={rowData} colNames={createHeaders(setUndos)} onCellChange={handleCellChange} />
                        </div>) : null
                    }
                </div>
            </div>            
        </>
    )
}

export default Transactions