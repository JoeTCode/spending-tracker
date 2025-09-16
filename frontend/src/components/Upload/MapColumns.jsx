import { useState, useEffect } from 'react';

const MapColumns = ({ parsedCSV, setParsedCSV, setFileParsed, setMapColumns, setColumnNames, allowCategorisation }) => {
    const [ dateColName, setDateColName ] = useState('');
    const [ descriptionColName, setDescriptionColName ] = useState('');
    const [ amountColNames, setAmountColNames ] = useState({col1: "", col2: ""});
    const [ categoryColName, setCategoryColName ] = useState('');
    const [amountMode, setAmountMode] = useState("single");
    const parsedColumnNames = Object.keys(parsedCSV[0]);
    const [ checkAmountCol, setCheckAmountCol ] = useState(false);
    const [ errorObject, setErrorObject ] = useState({ field: "", message: "" });
    const [ renderFindAmountDescriptor, setRenderFindAmountDescriptor ] = useState(false);
    const [ amountDescriptorMappings, setAmountDescriptorMappings ] = useState([]);
    // useEffect(() => {
    //     if (dateColName) {
    //         console.log(dateColName);
    //         const dateCol = parsedCSV.map(tx => tx[dateColName]);
    //         console.log(dateCol)
    //     };
    // }, [dateColName]);

    useEffect(() => {
        const isAllPositive = (amountCol) => {
            return true
            for (let val of amountCol) {
                const number = Number(val);
                if (isNaN(number)) {
                    const message =  `Value '${number}' cannot be converted to a number. Is the column '${amountColNames.col1}' the correct mapping for the amount column?`
                    setErrorObject({field: 'amount', message: message});
                    return false;
                };
                if (number < 0) return false;
            };
            return true;
        };
        // if there is only 1 amount column
        if (amountColNames.col1 && !amountColNames.col2) {
            const amountColName = amountColNames.col1;
            const amountCol = parsedCSV.map(tx => tx[amountColName]);
            
            if (isAllPositive(amountCol)) {
                setCheckAmountCol(true);
            };
        };
    }, [amountColNames]);

    const Rows = ({ uniqueDescriptorValues, setAmountDescriptorMappings}) => {
        const unqiueDescriptorValuesArray = [...uniqueDescriptorValues].filter(val => val);
        const [values, setValues] = useState(() =>
            unqiueDescriptorValuesArray.map(val => ({ value: val, type: "ignore" }))
        );

        const handleInputOnClick = (e, val) => {
            const type = e.target.value;
            console.log(type, val);
            setValues(prev => prev.map(obj => (
                obj.value === val ? { ...obj, type: type } : obj
            )));
        };

        useEffect(() => {
            console.log(values)
        }, [values]);

        return (
            <div className='bg-black rounded-lg overflow-y-auto max-h-30'>
                {unqiueDescriptorValuesArray.map(val => (
                    <div key={val} className='flex justify-between gap-y-4 mx-10 p-2'>
                        <div>{val}</div>
                        <div className='flex gap-x-2'>
                            <input type='radio' id='income' value='income' name={val}
                                onChange={(e) => handleInputOnClick(e, val)}
                            />
                            <label htmlFor='income'>Income</label>
                            <input type='radio' id='expense' value='expense' name={val}
                                onChange={(e) => handleInputOnClick(e, val)}
                            />
                            <label htmlFor='expense'>Expense</label>
                            <input type='radio' id='ignore' value='ignore' name={val} checked={values.find(v => v.value === val)?.type === 'ignore'}
                                onChange={(e) => handleInputOnClick(e, val)}
                            />
                            <label htmlFor='ignore'>Ignore</label>
                        </div>
                    </div>
                ))}
                <button
                    onClick={() => setAmountDescriptorMappings(values)}
                >
                    Save
                </button>
            </div>
        );
    };
    
    const FindAmountDescriptor = ({ parsedCSV, parsedColumnNames, setAmountDescriptorMappings }) => {
        const [ uniqueDescriptorValues, setUniqueDescriptorValues ] = useState(new Set([]));
        return (
            <div>
                <div>
                    <label htmlFor='descriptor-col-select' className='mb-2'>Descriptor column</label>
                    <select
                        id="descriptor-col-select"
                        className='p-2 cursor-pointer rounded-lg bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                        onChange={(e) => {
                            const descriptorColName = e.target.value;
                            const uniqueDescriptorColValues = new Set(parsedCSV.map(tx => tx[descriptorColName]));
                            setUniqueDescriptorValues(uniqueDescriptorColValues);
                        }}
                    >
                        <option value={""}>Select amount descriptor column</option>
                        {parsedColumnNames.map(col => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </select>
                </div>
                {uniqueDescriptorValues.size > 0 && (
                    <Rows 
                        uniqueDescriptorValues={uniqueDescriptorValues}
                        setAmountDescriptorMappings={setAmountDescriptorMappings}

                    />
                )}
            </div>
        );
    };
    
    return (
        <div className='w-full mx-[20%]'>
            <div className='bg-[#1a1818] w-full p-10'>
                <div className=''>
                    <p>Map CSV columns</p>
                    <p className='mb-6 text-sm text-neutral-400'>Map your CSV columns to the required transaction fields</p>
                </div>
                {errorObject.field && (
                    <div className='bg-red-400 py-10 px-5 text-center'>
                        {errorObject.message}
                    </div>
                )}
                <div className='flex flex-col gap-y-4 mt-5'>
                    <div className='flex flex-col'>
                        <label htmlFor="date-col-select" className='mb-2'>Transaction date</label>
                        <select 
                            id="date-col-select"
                            className='p-2 cursor-pointer rounded-lg bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                            onChange={(e) => {
                                setDateColName(e.target.value);
                                if (errorObject.type === 'date') setErrorObject({ field: '', message: '' });
                            }}
                        >
                            <option value={""}>Select date column</option>
                            {parsedColumnNames.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>   
                    </div>
                    <div className='flex flex-col'>
                        <label htmlFor="amount-col-select" className='mb-2'>Transaction amount</label>
                        <div className='flex gap-x-2 mb-2'>
                            <input type='radio' checked={amountMode === 'single'} id='single' value='single' name="amountColNum" onChange={(e) => setAmountMode(e.target.value)}/>
                            <label htmlFor='single'>Single column</label>
                            <input type='radio' id='double' value='double' name="amountColNum" onChange={(e) => setAmountMode(e.target.value)}/>
                            <label htmlFor='double'>Income + Expense columns</label>
                        </div>
                        {amountMode === 'single' && (
                            <div>
                                <select
                                    id="amount-col-select"
                                    className='p-2 cursor-pointer rounded-lg bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                                    onChange={(e) => {
                                        setAmountColNames(prev => ({...prev, col1: e.target.value}));
                                        if (errorObject.type === 'amount') setErrorObject({ field: '', message: '' });
                                    }}
                                >
                                    <option value={""}>Select amount column</option>
                                    {parsedColumnNames.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                                {checkAmountCol && (
                                    <div className='flex flex-col'>
                                        <div className='flex flex-1'>
                                            <p>
                                                The amount column has been flagged for having all positive values.
                                                Is there another column describing the transaction type as income or expense?
                                            </p>
                                            <div className='flex gap-x-2'>
                                                <span className='font-bold cursor-pointer' onClick={() => {
                                                    setCheckAmountCol(false);
                                                    setRenderFindAmountDescriptor(true);
                                                }}>Yes</span>
                                                <span className='font-bold cursor-pointer' onClick={() => setCheckAmountCol(false)}>No</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {renderFindAmountDescriptor && (
                                    <FindAmountDescriptor 
                                        parsedCSV={parsedCSV}
                                        parsedColumnNames={parsedColumnNames}
                                        setAmountDescriptorMappings={setAmountDescriptorMappings}
                                    />
                                )}
                            </div>
                            
                        )}
                        {amountMode === 'double' && (
                            <div className='flex flex-col gap-y-3'>
                                <select
                                    id="amount-col-select"
                                    className='p-2 cursor-pointer rounded-lg bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                                    onChange={(e) => setAmountColNames(prev => ({...prev, col1: e.target.value}))}
                                >
                                    <option value={""}>Select income column</option>
                                    {parsedColumnNames.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                                <select
                                    id="amount-col-select"
                                    className='p-2 cursor-pointer rounded-lg bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                                    onChange={(e) => setAmountColNames(prev => ({...prev, col2: e.target.value}))}
                                >
                                    <option value={""}>Select expense column</option>
                                    {parsedColumnNames.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className='flex flex-col'>
                        <label htmlFor="description-col-select" className='mb-2'>Transaction description</label>
                        <select
                            id="description-col-select"
                            className='p-2 cursor-pointer rounded-lg bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                            onChange={(e) => {
                                setDescriptionColName(e.target.value);
                                if (errorObject.type === 'description') setErrorObject({ field: '', message: '' });
                            }}
                        >
                            <option value={""}>Select description column</option>
                            {parsedColumnNames.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>
                    {!allowCategorisation && (
                        <div className='flex flex-col'>
                            <label htmlFor="category-col-select">Transaction category</label>
                            <select
                                id="category-col-select"
                                className='p-2 cursor-pointer rounded-lg bg-[#1a1818] text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                                onChange={(e) => {
                                    setCategoryColName(e.target.value);
                                    if (errorObject.type === 'category') setErrorObject({ field: '', message: '' });
                                }}
                            >
                                <option value={null}>Select category column</option>
                                {parsedColumnNames.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
            <div className='mt-2 flex justify-end gap-2'>
                <button 
                    onClick={() => {
                        setParsedCSV([]);
                        setFileParsed(false);
                        setMapColumns(false);
                    }}
                    className="bg-[#1a1818] py-2 px-4 rounded hover:bg-black cursor-pointer text-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={
                        errorObject.field ? undefined : 
                        (() => {
                            console.log(`date column: ${dateColName} - amount col: ${JSON.stringify(amountColNames)} - description col: ${descriptionColName}`)
                        })
                    }
                    disabled={errorObject.field.length > 0}
                    className={
                        errorObject.field ? 
                        "bg-[#1a1818] opacity-55 py-2 px-4 rounded cursor-not-allowed text-sm" : 
                        "bg-[#1a1818] py-2 px-4 rounded hover:bg-black cursor-pointer text-sm"
                    }
                >
                    Print
                </button>
            </div>
        </div>
    )
};

export default MapColumns;