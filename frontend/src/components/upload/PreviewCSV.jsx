import { useState, useEffect, useRef } from 'react';
import { useUpload } from './UploadContext';
import { useNavigate } from 'react-router-dom';
import CustomProgressBar from '../ProgressBar';
import EditableGrid from '../EditableGrid';
import { CATEGORIES, CATEGORY_TO_EMOJI, MIN_CONF_SCORE } from '../../utils/constants/constants';
import Warning from '../../assets/icons/warning-svgrepo-com.svg?react';
import Tick from '../../assets/icons/success-tick-svgrepo-com.svg?react';
import { bulkAddTransactions } from '../../db/db';
import { usePage } from '../../pages/PageContext'

const PreviewCSV = () => {
    const { state, dispatch } = useUpload();
    const { state: pageState, dispatch: pageDispatch } = usePage();

    const gridRef = useRef(null);
    // copy, with added status field (shallow copy - but tx object values are all primitive)
    const [ transactions, setTransactions ] = useState(state.lowConfidenceTransactions.map(tx => ({ ...tx, status: "unreviewed" })));
    const [ numReviewed, setNumReviewed ] = useState(0);
    const navigate = useNavigate();

    const headers = [
            {
                field: "date",
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
                    return <span className='bg-stone-300 dark:bg-stone-700 rounded-lg py-1 px-2'>{CATEGORY_TO_EMOJI[params.value] || params.value}</span>
                }
            },
            {
                field: "confidence",
                sort: "asc",
                editable: true,
                width: 110,
                headerClass: "font-bold",
                valueFormatter: params => {
                    if (params.value == null) return '';
                    return `${params.value}%`;
                }
            },
            {
                field: "account",
                editable: true,
                headerClass: "font-bold",
                width: 120
            },
            {
                field: "amount",
                editable: true,
                width: 110,
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
                field: "status",
                width: 80,
                headerClass: "font-bold",
                cellRenderer: params => {
                    if (params.data.status === 'unreviewed') {
                        return <Warning
                            className='w-5 h-5 mt-2 ml-3 text-yellow-400 hover:text-yellow-600 cursor-pointer'
                            onClick={() => {
                                setTransactions((prev) =>
                                    prev.map((row) =>
                                    row._id === params.data._id
                                        ? { ...row, status: "reviewed" }
                                        : row
                                    )
                                );
                                setNumReviewed(prev => prev + 1);
                            }}
                        />
                    }
                    else {
                        return <Tick 
                                className='w-5 h-5 mt-2 ml-3 text-green-600 hover:text-green-800 cursor-pointer'
                                onClick={() => {
                                    setTransactions((prev) =>
                                        prev.map((row) =>
                                        row._id === params.data._id
                                            ? { ...row, status: "unreviewed" }
                                            : row
                                        )
                                    );
                                    setNumReviewed(prev => prev - 1);
                                }}
                            />
                    }
                }
            }
    ];

    const sendData = async () => {
        const updatedTransactions = [];
        // remove status column from data
        const cleanedTransactions = transactions.map(({status, ...rest}) => rest);

        // Update initial transactions with user-recategorised low confidence transaction
        for (let tx of state.saveData) {
            const match = cleanedTransactions.find(newTx => newTx._id === tx._id);
            updatedTransactions.push(match || tx);
        };

        await bulkAddTransactions(updatedTransactions, state.csvFilename, state.dateFormat);
        console.log('Data saved successfully');

        navigate("/dashboard");
    };

    const handleCellChange = (updatedRow, params) => {
        const column = params.column.colId;

        if (column === 'category') {
            pageDispatch({ type: "SET_CORRECTIONS", payload: pageState.corrections + 1 });
            if (updatedRow.status === 'unreviewed') {
                updatedRow.status = 'reviewed';
                setTransactions(prev =>
                    prev.map(row => row._id === updatedRow._id ? { ...row, status: "reviewed" } : row)
                );
                setNumReviewed(prev => prev + 1);
            };
        }

        else {
            setTransactions(prev =>
                prev.map(row => row._id === updatedRow._id ? updatedRow : row)
            );
        };
    };

    const confScores = state.confidenceScores
    const lowConfScores = [];
    for (let score of confScores) score < MIN_CONF_SCORE ? lowConfScores.push(score) : '';

    const totalAverageConf = confScores.length > 0 ? (confScores.reduce((sum, current) => sum + current) / confScores.length) * 100 : null;
    const lowConfAverage = lowConfScores.length > 0 ? (lowConfScores.reduce((sum, current) => current < MIN_CONF_SCORE ? sum + current : sum) / lowConfScores.length) * 100 : null;
    
    return (
        <div className='w-full'>
            <div className='h-[700px] border border-neutral-300 shadow-sm dark:shadow-none dark:border-none dark:bg-dark rounded-lg pt-10 pb-10 px-10 flex flex-col'>
                <div className='flex-1'>
                    <p>Review Transactions</p>
                    <p className='mb-6 text-sm text-neutral-400'>Please review and recategorise the auto-categorised records.</p>
                    <div className='grid grid-cols-4 w-full items-center'>
                        <div className='text-center'>
                            <span className='text-lg font-bold'>{transactions.length}</span>
                            <p className='text-sm text-neutral-400'>Low-confidence transactions</p>
                        </div>
                        <div className='text-center'>
                            <span className='text-lg font-bold'>{lowConfAverage ? `${lowConfAverage.toFixed(2)}%` : '--'}</span>
                            <p className='text-sm text-neutral-400'>Low-confidence mean conf. score</p>
                        </div>
                        <div className='text-center'>
                            <span className='text-lg font-bold'>{state.transactions.length}</span>
                            <p className='text-sm text-neutral-400'>Total transactions</p>
                        </div>
                        <div className='text-center'>
                            <span className='text-lg font-bold'>{totalAverageConf ? `${totalAverageConf.toFixed(2)}%` : '--'}</span>
                            <p className='text-sm text-neutral-400'>Total mean conf. score</p>
                        </div>
                    </div>

                    <div className="mt-4 mb-4 w-full">
                        <CustomProgressBar current={numReviewed} total={transactions.length} label={"Progress"} />
                    </div>
                    
                    <div className='h-[420px]'>
                        <EditableGrid gridRef={gridRef} rowData={transactions} colNames={headers} onCellChange={handleCellChange} />
                    </div>
                </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <button 
                    onClick={() => {
                        // setFileParsed(false);
                        // dispatch({ type: "SET_FILE_PARSED", payload: false });
                        // setPreviewCSV(false);
                        // dispatch({ type: "SET_PREVIEW_CSV", payload: false });
                        dispatch({ type: "SET_TRANSACTIONS", payload: [] });
                        dispatch({ type: "SET_STAGE", payload: "upload"});
                    }}
                    className="text-white bg-dark py-2 px-4 rounded hover:bg-black cursor-pointer text-sm"
                >
                    Cancel
                </button>
                <button onClick={sendData} className="text-white bg-dark py-2 px-4 rounded hover:bg-black cursor-pointer text-sm">
                    Upload transactions
                </button>
            </div>
        </div>
    );
};

export default PreviewCSV; 