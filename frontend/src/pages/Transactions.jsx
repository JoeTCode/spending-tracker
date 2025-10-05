import { NavBar, EditableGrid } from '../components';
import { useRef, useState, useEffect } from 'react';
import { CATEGORIES, CATEGORY_TO_EMOJI, MONTHS, MIN_CORRECTIONS } from '../utils/constants/constants';
import { db, getTransactions, updateTransaction, removeTransaction, bulkRemoveTransactions, bulkRestoreTransactions, restoreTransaction, getCsvData } from '../db/db';
import Trash from '../assets/icons/trash-svgrepo-com.svg?react';
import UndoLeft from '../assets/icons/undo-left-round-svgrepo-com.svg?react'
import UndoRight from '../assets/icons/undo-right-round-svgrepo-com.svg?react';
import ChevronLeft from '../assets/icons/chevron-left-svgrepo-com.svg?react';
import ChevronRight from '../assets/icons/chevron-right-svgrepo-com.svg?react';
import DateRange from '../assets/icons/date-range-svgrepo-com.svg?react';
import Brain from '../assets/icons/brain-solid-svgrepo-com.svg?react';
import { usePage } from './PageContext';
import Warning from '../assets/icons/warning-circle-svgrepo-com.svg?react';
import Edit from '../assets/icons/edit-1-svgrepo-com.svg?react';
import { toast } from 'react-toastify';
import { useAuth0 } from '@auth0/auth0-react';
import { useInternalAuth } from '../components/useInternalAuth.jsx';
import api from '../axios/api.js';
import { mkConfig, generateCsv, download } from "export-to-csv";

const CATEGORIES_SET = new Set(CATEGORIES);
const UNDO_REDO_DELAY = 500;
const SELECT_CSV_DEFAULT = "Filter by CSV";

// customise column format and functions for the EditableGrid cols argument
const createHeaders = (setUndos, setTransactions) => ([
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
        headerClass: "font-bold",
        width: 315
    },
    {
        field: "category",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: CATEGORIES },
        singleClickEdit: true,
        headerClass: "font-bold",
        width: 170,
        cellRenderer: params => {
            return <span className='bg-stone-300 dark:bg-stone-700 rounded-lg py-1 px-2'>{CATEGORY_TO_EMOJI[params.value] || params.value}</span>
        }
    },
    {
        field: "amount",
        editable: true,
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
                const deletedRowData = props.api.applyTransaction({ remove: [props.data] })
                const deletedRow = deletedRowData.remove[0].data
                const csvData = await db.csvData.get(deletedRow.csvId);
                
                await removeTransaction(deletedRow);
                setTransactions(prev => prev.filter(tx => tx._id !== deletedRow._id));

                setUndos((prev) => {
                    if (prev) {
                        return [...prev, { type: 'delete', row: deletedRow, csvData: csvData }] // { {row_x}, {row_y}, {type: 'delete', row: {row_z}} }
                    } else {
                        return [{ type: 'delete', row: deletedRow }]
                    };
                });
            };
            
            return (
                <div className='hover:bg-[#dd90908a] text-neutral-500 dark:text-neutral-400 hover:text-red-700 rounded-full w-7 h-7 mt-1 ml-3 justify-center items-center flex cursor-pointer'>
                    <Trash onClick={deleteRow} className='w-5 h-5' />
                </div>
                
            );
        }
    }
]);

const Undo = ({ undos, undo }) => (
  <button 
    onClick={undos.length > 0 ? undo : undefined} 
    disabled={undos.length === 0} 
    className={undos.length === 0 ? 
        "w-20 flex items-center bg-gray-600 rounded-lg p-1 shadow-lg cursor-not-allowed text-sm gap-2 h-8 opacity-50" : 
        'w-20 flex items-center dark:bg-darker rounded-lg p-1 cursor-pointer border border-neutral-300 hover:bg-neutral-200 dark:border-none dark:hover:bg-black text-sm gap-2 h-8'}
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
        "w-20 flex items-center bg-gray-600 rounded-lg p-1 cursor-not-allowed text-sm gap-2 h-8 opacity-50" : 
        'w-20 flex items-center dark:bg-darker rounded-lg p-1 cursor-pointer border border-neutral-300 hover:bg-neutral-200 dark:border-none dark:hover:bg-black text-sm gap-2 h-8'}
  >
    <UndoRight className='w-5 h-5 relative top-[1px]' />
    Redo
  </button>
);

const Prev = ({ noTransactions, setUndos, setRedos, selectedTimeframe, getTransactions, setRowData, setSelectedTimeframe, setIsFilteredByAll, transactionsDateRange, setSelectedCsvName }) => {
    const prevMonth = new Date(selectedTimeframe);
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    if (noTransactions || prevMonth.getTime() < new Date(transactionsDateRange.min).getTime()) {
        return (
            <button
                className="flex items-center gap-1 bg-gray-600 rounded-lg p-1 pr-3 cursor-not-allowed text-sm h-8 opacity-50"
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
                setSelectedCsvName(SELECT_CSV_DEFAULT);
                console.log('PREV', prevMonth);
                const prevTransactions = await getTransactions({ rangeType: 'vm', selectedMonth: prevMonth.getMonth(), selectedYear: prevMonth.getFullYear() });
                console.log('prev', prevTransactions);
                setRowData(prevTransactions);
                setSelectedTimeframe(prev => {
                    const dateObj = new Date(prev);
                    return dateObj.setMonth(dateObj.getMonth() - 1);
                });
                setIsFilteredByAll(false);
            }}
            className='flex items-center gap-1 dark:bg-darker rounded-lg p-1 cursor-pointer border border-neutral-300 hover:bg-neutral-200 dark:border-none dark:hover:bg-black text-sm h-8'
        >
            <ChevronLeft className='h-5 w-5 relative top-[1px]'/>
            <span>Previous</span>
        </button>
    )
};

const Next = ({ noTransactions, setUndos, setRedos, selectedTimeframe, getTransactions, setRowData, setSelectedTimeframe, setIsFilteredByAll, transactionsDateRange, setSelectedCsvName }) => {
    const nextMonth = new Date(selectedTimeframe);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (noTransactions || nextMonth.getTime() > new Date(transactionsDateRange.max).getTime()) {
        return (
            <button
                className="flex items-center gap-1 bg-gray-600 rounded-lg p-1 cursor-not-allowed text-sm h-8 opacity-50"
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
                    setSelectedCsvName(SELECT_CSV_DEFAULT);
                    console.log('NEXT', nextMonth);
                    const nextTransactions = await getTransactions({ rangeType:'vm', selectedMonth: nextMonth.getMonth(), selectedYear: nextMonth.getFullYear() });
                    setRowData(nextTransactions);
                    setSelectedTimeframe(prev => {
                        const dateObj = new Date(prev);
                        return dateObj.setMonth(dateObj.getMonth() + 1);
                    });
                    setIsFilteredByAll(false);
                }}
                className='flex items-center gap-1 dark:bg-darker rounded-lg p-1 cursor-pointer border border-neutral-300 hover:bg-neutral-200 dark:border-none dark:hover:bg-black text-sm h-8'
            >
                <span className=''>Next</span>
                <ChevronRight className='h-5 w-5 relative top-[1px]'/>
            </button>
        );
    };    
};

const All = ({ setUndos, setRedos, getTransactions, setRowData, isFilteredByAll, setIsFilteredByAll, setSelectedTimeframe, latestTransaction, setSelectedCsvName }) => (
    <button 
        onClick={
            isFilteredByAll ? 
            (undefined) : (
            async () => {
                setUndos([]);
                setRedos([]);
                setSelectedCsvName(SELECT_CSV_DEFAULT);
                setSelectedTimeframe(new Date(latestTransaction));
                const allTransactions = await getTransactions({ rangeType: 'a' });
                console.log(latestTransaction);
                setRowData(allTransactions);
                setIsFilteredByAll(true);
            })
        }
        disabled={isFilteredByAll}
        className={isFilteredByAll ? 'bg-gray-600 rounded-lg p-1 pl-3 pr-3 cursor-not-allowed text-sm h-8 opacity-50' :
            'dark:bg-darker rounded-lg p-1 pl-3 pr-3 cursor-pointer hover:bg-neutral-200 border border-neutral-300 dark:border-none dark:hover:bg-black text-sm h-8'}
    >
        All
    </button>
);
// flex items-center gap-1 bg-gray-600 rounded-lg m-1 p-1 pr-3 shadow-lg cursor-not-allowed text-sm h-8 opacity-50
const Transactions = () => {
    const { state, dispatch } = usePage();

    const { user: internalUser } = useInternalAuth(); 

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
    const [ isTraining, setIsTraining ] = useState(false);
    const canTrain = state.corrections >= MIN_CORRECTIONS && transactions.length > 0 && state.modelType !== 'globalModel';
    const [ csvNames, setCsvNames ] = useState([]);
    const [ csvNamesToId, setCsvNamesToId ] = useState({});
    const [ selectedCsvName, setSelectedCsvName ] = useState('');
    const { isAuthenticated, getAccessTokenSilently } = useAuth0();


    useEffect(() => {
        const retrieveTransactionData = async () => {
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
            
            setRowData(data); // new
        };

        const queryCsvDb = async () => {
            const csvData = await db.csvData.toArray();
            console.log(csvData);
            setCsvNames(csvData.map(data => data.name));

            const obj = {};
            for (let data of csvData) {
                obj[data.name] = data.id;
            };
            setCsvNamesToId(obj);
        };

        queryCsvDb();
        retrieveTransactionData();
    }, []);

    useEffect(() => {
        if (selectedCsvName === "all") {
            setRowData(transactions);
        }
        else {
            const id = csvNamesToId[selectedCsvName];
            const filtered = transactions.filter(tx => tx.csvId === id);
            setRowData(filtered);
        }
    }, [selectedCsvName]);

    async function undo() {
        const undosPopped = [...undos];
        const action = undosPopped.pop();
        if (!action) return;

        if (gridRef.current?.api) {
            if (action.type === 'deleteFiltered') {
                gridRef.current.api.applyTransaction({ add: action.rows });
                setRedos(prev => [...prev, action]);
            }

            else if (action.type === 'delete') {
                gridRef.current.api.applyTransaction({ add: [action.row] });
                setRedos(prev => [...prev, action]);
            }
            else {
                gridRef.current.api.applyTransaction({ update: [action.before] });
                setRedos(prev => [...prev, action]);
            };
        }

        if (timerId) clearTimeout(timerId);
        // start timer
        const id = setTimeout(async () => {
            if (action.type === 'deleteFiltered') {
                const restoredRows = await bulkRestoreTransactions(action.rows, action.csvData);
                setRowData(restoredRows);
                setTransactions(prev => [...prev, ...restoredRows]);
            }
            else if (action.type === 'delete') {
                await restoreTransaction(action.row, action.csvData);
                setTransactions(prev => [...prev, action.row]);
            }
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

        if (action.type === 'deleteFiltered') {
            gridRef.current.api.applyTransaction({ remove: action.rows });
            setUndos(prev => [...prev, action]);
        }
        else if (action.type === 'delete') {
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
            if (action.type === 'deleteFiltered') {
                await bulkRemoveTransactions(action.rows);
                const idMap = new Set(action.rows.map(tx => tx._id));
                setTransactions(prev => prev.filter(tx => !idMap.has(tx._id)));
            }
            else if (action.type === 'delete') {
                await removeTransaction(action.row);
                setTransactions(prev => prev.filter(tx => tx._id !== action.row._id));
            }
            else await updateTransaction(action.after);
            setTimerId(null);
        }, UNDO_REDO_DELAY);

        setTimerId(id);
        setRedos(redosPopped)
    };

    const handleCellChange = async (updatedRow, params) => {
        setRedos([]);
        const column = params.column.colId;

        if (column === 'category') {
            if (CATEGORIES_SET.has(updatedRow[column])) {
                updatedRow['trained'] = false;
                dispatch({ type: "SET_CORRECTIONS", payload: state.corrections + 1 });
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

    // trains on all transaction data, not rowData (which is selected page specific)
    const handleTrain = async () => {
        await new Promise(r => setTimeout(r, 0));

        const descriptions = [];
        const targets = [];
        const idMap = new Set([]);

        for (let tx of transactions) {
            if (CATEGORIES_SET.has(tx.category) && !tx.trained && tx.is_trainable) {
                descriptions.push(tx.description);
                targets.push(tx.category);
                idMap.add(tx._id);
            };
        };

        if (descriptions.length === 0 || targets.length === 0) {
            // timeout to show loading spinner, then exit
            setIsTraining(false);
            console.warn(`Tranasctions not found`)
            return false;
        }
        
        else {
            try {
                const token = isAuthenticated ? await getAccessTokenSilently() : '';    
                await api.post(
                    "/train",
                    { 
                        descriptions: descriptions, 
                        categories: targets, 
                        modelType: state.modelType,
                        isAuth0User: isAuthenticated,
                    },
                    { 
                        headers: { "authorization": `Bearer ${token}` },
                        withCredentials: true
                    },
                );
                // await trainModel(descriptions, targets);

                setTransactions(prev =>
                    prev.map(tx => 
                        idMap.has(tx._id) ? { ...tx, trained: true } : tx
                    )
                );

                dispatch({ type: "SET_CORRECTIONS", payload: 0 });

                const updateObjects = [...idMap].map(id => ({
                    key: id, 
                    changes: { trained: true }
                }));
                db.transactions.bulkUpdate(updateObjects);
                return true;

            } catch (err) {
                return false;

            } finally {
                setIsTraining(false);
            }
        };                     
    };

    return (
        <>
            <NavBar /> 
            <div className='flex w-full justify-center'>            
                <div className='flex flex-col justify-center mt-40 mb-10 max-w-[1000px]'>
                    
                    {state.modelType !== 'globalModel' && (
                        <div className="shadow-sm mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full">
                                        <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-purple-900 dark:text-purple-100">AI Model Training</h4>
                                        <p className="text-sm text-purple-700 dark:text-purple-300">
                                            Train your personal AI with your re-categorisations and transaction descriptions
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="flex items-center gap-1">
                                            <Edit className="relative top-[1px] h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            <span className="text-sm font-medium">{state.corrections > MIN_CORRECTIONS ? MIN_CORRECTIONS : state.corrections}/{MIN_CORRECTIONS}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Edits made</p>
                                    </div>
                                    <button
                                        onClick={canTrain || isTraining ? 
                                            (async () => {
                                                setIsTraining(true);
                                                const res = await handleTrain();
                                                if (res) toast.success("Training successfully completed!");
                                                else toast.error("Something went wrong!");
                                            })
                                            : undefined 
                                        }
                                        disabled={!canTrain || isTraining}
                                        className={
                                            isTraining ? "flex items-center gap-2 dark:bg-dark rounded-lg py-1 px-2 opacity-50 cursor-text" : canTrain ?
                                            "flex items-center gap-1 text-purple-600 bg-purple-400/30 hover:bg-purple-500/30 dark:bg-dark dark:hover:bg-black rounded-lg py-1 px-2 cursor-pointer" :
                                            "text-purple-300 dark:text-purple-400 flex items-center gap-1 cursor-not-allowed bg-neutral-700 opacity-60 rounded-lg py-1 px-2"
                                        }
                                    >
                                        {isTraining ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                <span className='relative top-[-1px] text-sm'>Training...</span>                                            
                                            </>
                                        ) : (
                                            <>
                                                <Brain className="h-5 w-5 text-sm" />
                                                <span className='relative top-[-2px]'>Train AI</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            {!canTrain && transactions.length > 0 && (MIN_CORRECTIONS > state.corrections) && (
                                <div className="mt-3 flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400">
                                    <Warning className="h-4 w-4 relative top-[1px]" />
                                    <span>Re-categorise {MIN_CORRECTIONS - state.corrections} more transaction{MIN_CORRECTIONS - state.corrections !== 1 ? 's' : ''} to enable training</span>
                                </div>
                            )}
                        </div>
                    )}
                    

                    <div className='min-w-[905px] shadow-sm border border-neutral-300 dark:border-none dark:shadow-lg dark:bg-dark rounded-lg p-10 pt-10 mt-4'>
                        <div className='flex justify-between'>
                            {
                                selectedCsvName && selectedCsvName !== SELECT_CSV_DEFAULT ? <div></div>:
                                isFilteredByAll ?
                                <div className='flex ml-2 items-center mb-5'>
                                    <DateRange className='h-5 w-5' />
                                    <h2 className='dark:text-gray-300 ml-2'>
                                        All Transactions
                                    </h2>
                                </div> : 
                                <div className='flex ml-2 items-center mb-5'>
                                    <DateRange className='h-5 w-5' />
                                    <h2 className='dark:text-gray-300 ml-2'>
                                        {MONTHS[new Date(selectedTimeframe).getMonth()]} {new Date(selectedTimeframe).getFullYear()}
                                    </h2>
                                </div>
                            }
                            <button
                                className={rowData.length === 0 ? 
                                    'flex gap-x-2 mb-5 bg-gray-600 rounded-lg py-2 px-3 cursor-not-allowed text-sm opacity-50' :
                                    'flex gap-x-2 mb-5 dark:bg-darker rounded-lg py-2 px-3 cursor-pointer hover:bg-neutral-100 border border-neutral-300! dark:border-none dark:hover:bg-black text-sm'
                                }
                                onClick={rowData.length === 0 ? undefined :
                                    async () => {
                                        setRowData([]);
                                                              
                                        const uniqueCsvIds = new Set(rowData.map(row => row.csvId));
                                        const csvData = await db.csvData.toArray();
                                        const restoredCsvData = csvData.filter(data => uniqueCsvIds.has(data.id));
                                        setUndos((prev) => {
                                            if (prev) {
                                                return [...prev, { type: 'deleteFiltered', rows: rowData, csvData: restoredCsvData }];
                                            } else return [{ type: 'deleteFiltered', rows: rowData, csvData: restoredCsvData }];
                                        });

                                        await bulkRemoveTransactions(rowData);
                                        const idMap = new Set(rowData.map(tx => tx._id));
                                        setTransactions(prev => prev.filter(tx => !idMap.has(tx._id)));
                                    }
                                }
                            >
                                <Trash className="relative top-[1px] w-5 h-5 text-red-700" />
                                <p className='text-red-600'>Delete filtered</p>
                            </button>
                        </div>
                        
                        <div className='flex justify-between mb-3'>
                            <div className='flex gap-x-2'>
                                <Prev 
                                    noTransactions={transactions.length === 0} setUndos={setUndos} setRedos={setRedos} selectedTimeframe={new Date(selectedTimeframe)} getTransactions={getTransactions}
                                    setRowData={setRowData} setSelectedTimeframe={setSelectedTimeframe} setIsFilteredByAll={setIsFilteredByAll}
                                    transactionsDateRange={transactionsDateRange} setSelectedCsvName={setSelectedCsvName}
                                />
                                <Next 
                                    noTransactions={transactions.length === 0} setUndos={setUndos} setRedos={setRedos} selectedTimeframe={new Date(selectedTimeframe)} getTransactions={getTransactions}
                                    setRowData={setRowData} setSelectedTimeframe={setSelectedTimeframe} setIsFilteredByAll={setIsFilteredByAll}
                                    transactionsDateRange={transactionsDateRange} setSelectedCsvName={setSelectedCsvName}
                                />
                                <All 
                                    setUndos={setUndos} setRedos={setRedos} getTransactions={getTransactions} setRowData={setRowData}
                                    isFilteredByAll={isFilteredByAll} setIsFilteredByAll={setIsFilteredByAll} setSelectedTimeframe={setSelectedTimeframe}
                                    latestTransaction={latestTransaction} setSelectedCsvName={setSelectedCsvName}
                                />
                                <select
                                    className='flex gap-x-2 items-center border border-neutral-300 hover:bg-neutral-200 dark:border-none dark:bg-darker rounded-lg py-2 px-3 cursor-pointer dark:hover:bg-black text-sm h-8 max-w-40'
                                    value={selectedCsvName}
                                    onChange={(e) => setSelectedCsvName(e.target.value)}
                                >
                                    <option value={"all"}>{SELECT_CSV_DEFAULT}</option>
                                    {csvNames.map(name => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex gap-x-2'>
                                <Undo undos={undos} undo={undo} />
                                <Redo redos={redos} redo={redo} />
                            </div>
                        </div>
                        
                        {rowData && rowData.length > 0 ? ( <div className='h-170 w-206'>
                            <EditableGrid gridRef={gridRef} rowData={rowData} colNames={createHeaders(setUndos, setTransactions)} onCellChange={handleCellChange} />
                            </div>) : <div>No data</div>
                        }

                        
                        <button 
                            onClick={ transactions.length > 0 ? (
                                async () => {
                                    const csvData = await getCsvData();
                                    const csvConfig = mkConfig({ useKeysAsHeaders: true, filename: "trackyourtransactions-csv-export" });
                                    const csv = generateCsv(csvConfig)(csvData);
                                    download(csvConfig)(csv);
                                }) : undefined
                            }
                                
                            className={ transactions.length > 0 ?
                                'border border-neutral-300 hover:bg-neutral-200 dark:border-none dark:text-white mt-5 dark:bg-darker dark:hover:bg-black rounded-lg p-2 cursor-pointer' :
                                'opacity-40 border border-neutral-300 dark:border-none dark:text-white mt-5 dark:bg-darker rounded-lg p-2 cursor-not-allowed'                           
                            }
                        >
                            Export as CSV
                        </button>   
                    </div>
                </div>
            </div>
        </>
    );
};

export default Transactions