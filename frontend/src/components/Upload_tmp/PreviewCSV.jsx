import { useState, useEffect } from 'react';

const PreviewCSV = ({ saveData, lowConfTx, setFileParsed, setPreviewCSV }) => {
    console.log('saveData', saveData);
    console.log('lowConfTx', lowConfTx);
    const gridRef = useRef(null);
    // copy, with added status field (shallow copy - but tx object values are all primitive)
    const [ transactions, setTransactions ] = useState(lowConfTx.map(tx => ({ ...tx, status: "unreviewed" })));
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
                    return <span className='bg-stone-700 rounded-lg py-1 px-2'>{CATEGORY_TO_EMOJI[params.value] || params.value}</span>
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
        for (let tx of saveData) {
            const match = cleanedTransactions.find(newTx => newTx._id === tx._id);
            updatedTransactions.push(match || tx);
        };

        console.log('Data to be saved:', updatedTransactions)
        await db.barclaysTransactions.bulkAdd(updatedTransactions);
        console.log('Data saved successfully');

        navigate("/dashboard");
    };

    const handleCellChange = (updatedRow, params) => {
        const column = params.column.colId;

        if (column === 'category') {
            // console.log(correctionsCount);
            // if (CATEGORIES_SET.has(updatedRow[column])) {
            //     incrementCorrectionsCount();
            // };
            // update status column

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

    return (
        <div className='w-full max-w-[1000px] xl:mx-[10%]'>
            <div className='h-[700px] bg-[#1a1818] rounded-lg pt-10 pb-10 px-10 flex flex-col'>
                <div className='flex-1'>
                    <p>Low confidence transactions</p>
                    <p className='mb-6 text-sm text-neutral-400'>Please review and recategorise the auto-categorised records.</p>
                    <div className='flex flex-col w-full items-center'>
                        <span className='text-lg font-bold'>{transactions.length}</span>
                        <p className='text-sm text-neutral-400'>Total transactions</p>
                    </div>
                    {/* <span>{numReviewed}/{lowConfTx.length}</span> */}
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
                        setFileParsed(false);
                        setPreviewCSV(false);
                    }}
                    className="bg-[#1a1818] py-2 px-4 rounded hover:bg-black cursor-pointer text-sm"
                >
                    Cancel
                </button>
                <button onClick={sendData} className="bg-[#1a1818] py-2 px-4 rounded hover:bg-black cursor-pointer text-sm">
                    Done - Upload transactions
                </button>
            </div>
        </div>
    );
};

export default PreviewCSV;