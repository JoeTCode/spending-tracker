import { useState, useEffect, useRef } from 'react';
import { useUpload } from './UploadContext';
import CustomProgressBar from '../ProgressBar';
import EditableGrid from '../EditableGrid';
import { CATEGORIES, CATEGORY_TO_EMOJI } from '../../utils/constants/constants';
import { db, bulkAddTransactions } from '../../db/db';
import { useNavigate } from 'react-router-dom';
import { usePage } from '../../pages/PageContext';

const ReviewDuplicates = ({ getRemoveFileProps }) => {
    const { state, dispatch } = useUpload();
    const { state: pageState, dispatch: pageDispatch } = usePage();
    const gridRef = useRef(null);
    const [ duplicates, setDuplicates ] = useState(state.duplicateRows?.map(tx => ({ ...tx })));
    const [ numSelected, setNumSelected ] = useState(0);
    const [ selectedRows, setSelectedRows ] = useState([]);
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
                headerClass: "font-bold",
                width: 170,
                cellRenderer: params => {
                    return <span className='bg-stone-300 dark:bg-stone-700 rounded-lg py-1 px-2'>{CATEGORY_TO_EMOJI[params.value] || params.value}</span>
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
    ];

    const handleCellChange = (updatedRow) => {

        setDuplicates(prev =>
            prev.map(row => row._id === updatedRow._id ? updatedRow : row)
        );
    };

    const handleContinue = async () => {
        dispatch({ type: "SET_DUPLICATE_ROWS", payload: [] });
        
        // remove duplicate transactions that were not marked as non-duplicate from lowConfTx
        const selectedIdSet = new Set(selectedRows.map(tx => tx._id));
        const nonSelectedIdSet = new Set();
        for (const tx of duplicates) {
            if (!selectedIdSet.has(tx._id)) {
                nonSelectedIdSet.add(tx._id);
            }
        };

        const saveData = [ ...state.nonDuplicateRows, ...selectedRows ];
        if (pageState.allowCategorisation) {
            dispatch({ type: "SET_SAVE_DATA", payload: saveData });
            // remove non selected transactions from low conf tx
            dispatch({ type: "FILTER_LOW_CONFIDENCE_TRANSACTIONS", payload: nonSelectedIdSet });
            // dispatch({ type: "SET_PREVIEW_CSV", payload: true });
            dispatch({ type: "SET_STAGE", payload: "review"});
        } else {
            await bulkAddTransactions(saveData, state.csvFilename, state.dateFormat);
            navigate('/dashboard');
        }
    };

    const handleSelectionChanged = (event) => {
        const selected = event.api.getSelectedRows();
        setNumSelected(selected.length);
        setSelectedRows(selected);
    }

    return (
        <div className='w-full'>
            {state.absoluteDuplicateRows.length > 0 && (
                <div className='text-white w-full bg-red-600/60 py-10 dark:border-2 dark:border-[#ca32328f] shadow-md rounded-lg text-center mb-5'>
                    <span className='font-bold'>{state.absoluteDuplicateRows.length}</span> <p>Absolute duplicates skipped</p>
                </div>)}
            
            <div>
                <div className='h-[700px] border shadow-sm border-neutral-300 dark:border-none dark:bg-dark rounded-lg pt-10 pb-10 px-10 flex flex-col'>
                    <div className='flex-1'>
                        <p>Possible duplicate transactions identified</p>
                        <p className='mb-6 text-sm text-neutral-400'>Please review records found in your CSV that match previously uploaded transactions.</p>
                        <div className='w-full grid grid-cols-3'>
                            <div className='flex flex-col items-center'>
                                <span className='text-black text-lg font-bold'>{state.nonDuplicateRows.length + duplicates.length + state.absoluteDuplicateRows.length}</span>
                                <p className='text-sm text-neutral-400'>Total uploaded transactions</p>
                            </div>
                            <div className='flex flex-col items-center'>
                                <span className='text-black text-lg font-bold'>{duplicates.length}</span>
                                <p className='text-sm text-neutral-400'>Possible duplicate transactions</p>
                            </div>
                            <div className='flex flex-col items-center'>
                                <span className='text-black text-lg font-bold'>{state.nonDuplicateRows.length}</span>
                                <p className='text-sm text-neutral-400'>Non-duplicate transactions</p>
                            </div>
                        </div>
                        { duplicates.length > 0 && (<div className="mt-4 w-full">
                            <CustomProgressBar current={numSelected} total={duplicates.length} label={"Transactions selected to save"} />
                        </div>)}
                        
                        <div className='flex h-[420px] w-full mt-4 justify-center'>
                            <div className='w-195 h-full'>
                                <EditableGrid
                                    gridRef={gridRef} rowData={duplicates} colNames={headers} onCellChange={handleCellChange}
                                    rowSelection={{ mode: 'multiRow' }} onSelectionChanged={handleSelectionChanged}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button 
                        {...getRemoveFileProps()}
                        onClick={() => {
                            // dispatch({ type: "SET_DUPLICATE_WARNING", payload: false });
                            dispatch({ type: "SET_STAGE", payload: "upload"});
                            dispatch({ type: "SET_DUPLICATE_ROWS", payload: [] })
                        }}
                        className="text-white bg-dark py-2 px-4 rounded hover:bg-black cursor-pointer text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            state.nonDuplicateRows.length > 0 ? handleContinue() : undefined;
                        }}
                        disabled={state.nonDuplicateRows.length === 0}
                        className={
                                state.nonDuplicateRows.length > 0 ? "text-white bg-dark py-2 px-4 rounded hover:bg-black cursor-pointer text-sm" :
                                "text-white bg-dark py-2 px-4 rounded text-sm cursor-not-allowed opacity-50"
                        }
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    )
};

export default ReviewDuplicates;