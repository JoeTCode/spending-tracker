import { useState, useEffect } from 'react';

const ReviewDuplicates = ({ nonDuplicateRows, absoluteDuplicateRows, duplicateRows, setDuplicateRows, setDuplicateWarning, setFileParsed, setPreviewCSV, getRemoveFileProps, setSaveData, setLowConfTx }) => {
    const gridRef = useRef(null);
    const [ duplicates, setDuplicates ] = useState(duplicateRows.map(tx => ({ ...tx })));
    const [ numSelected, setNumSelected ] = useState(0);
    const [ selectedRows, setSelectedRows ] = useState([]);

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
                    return <span className='bg-stone-700 rounded-lg py-1 px-2'>{CATEGORY_TO_EMOJI[params.value] || params.value}</span>
                }
            },
            {
                field: "account",
                editable: true,
                headerClass: "font-bold",
                width: 120
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

    const handleCellChange = (updatedRow, params) => {
        const column = params.column.colId;
        // if (column === 'category') {
        //     // console.log(correctionsCount);
        //     // if (CATEGORIES_SET.has(updatedRow[column])) {
        //     //     incrementCorrectionsCount();
        //     // };
        // }

        setDuplicates(prev =>
            prev.map(row => row._id === updatedRow._id ? updatedRow : row)
        );
    };

    const handleContinue = () => {
        setDuplicateWarning(false);
        setDuplicateRows([]);
        // store the non duplicates and transactions marked as non-duplicate by user
        setSaveData([ ...nonDuplicateRows, ...selectedRows ]);

        // remove duplicate transactions that were not marked as non-duplicate from lowConfTx
        const selectedIdSet = new Set(selectedRows.map(tx => tx._id));
        const nonSelectedIdSet = new Set();
        for (const tx of duplicates) {
            if (!selectedIdSet.has(tx._id)) {
                nonSelectedIdSet.add(tx._id);
            }
        };
        setLowConfTx(prev => {
            return prev.filter(tx => !nonSelectedIdSet.has(tx._id))
        });

        setPreviewCSV(true);
        setFileParsed(true);
    };

    const handleSelectionChanged = (event) => {
        const selected = event.api.getSelectedRows();
        setNumSelected(selected.length);
        setSelectedRows(selected);
    }

    return (
        <div className='w-full max-w-[1000px] xl:mx-[10%]'>
            {absoluteDuplicateRows.length > 0 && (
                <div className='w-full bg-red-400 py-10 opacity-80 border-2 border-[#ca32328f] shadow-md rounded-lg text-center mb-5'>
                    <span className='font-bold'>{absoluteDuplicateRows.length}</span> <p>Absolute duplicates skipped</p>
                </div>)}
            
            <div>
                <div className='h-[700px] bg-[#1a1818] rounded-lg pt-10 pb-10 px-10 flex flex-col'>
                    <div className='flex-1'>
                        <p>Possible duplicate transactions identified</p>
                        <p className='mb-6 text-sm text-neutral-400'>Please review records found in your CSV that match previously uploaded transactions.</p>
                        <div className='w-full grid grid-cols-3'>
                            <div className='flex flex-col items-center'>
                                <span className='text-lg font-bold'>{nonDuplicateRows.length + duplicates.length}</span>
                                <p className='text-sm text-neutral-400'>Total uploaded transactions</p>
                            </div>
                            <div className='flex flex-col items-center'>
                                <span className='text-lg font-bold'>{duplicates.length}</span>
                                <p className='text-sm text-neutral-400'>Possible duplicate transactions</p>
                            </div>
                            <div className='flex flex-col items-center'>
                                <span className='text-lg font-bold'>{nonDuplicateRows.length - absoluteDuplicateRows.length}</span>
                                <p className='text-sm text-neutral-400'>Non-duplicate transactions</p>
                            </div>
                        </div>
                        { duplicates.length > 0 && (<div className="mt-4 w-full">
                            <CustomProgressBar current={numSelected} total={duplicates.length} label={"Transactions selected to save"} />
                        </div>)}
                        
                        <div className='h-[420px] mt-4'>
                            <EditableGrid
                                gridRef={gridRef} rowData={duplicates} colNames={headers} onCellChange={handleCellChange}
                                rowSelection={{ mode: 'multiRow' }} onSelectionChanged={handleSelectionChanged}
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button 
                        {...getRemoveFileProps()}
                        onClick={() => {
                            setDuplicateWarning(false);
                            setFileParsed(false);
                            setDuplicateRows([]);
                        }}
                        className="bg-[#1a1818] py-2 px-4 rounded hover:bg-black cursor-pointer text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {duplicateRows.length > 0 ? handleContinue : undefined }}
                        disabled={duplicateRows.length === 0}
                        className={
                                duplicateRows.length > 0 ? "bg-[#1a1818] py-2 px-4 rounded hover:bg-black cursor-pointer text-sm" :
                                "bg-[#1a1818] py-2 px-4 rounded text-sm cursor-not-allowed opacity-50"
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