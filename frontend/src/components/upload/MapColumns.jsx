import { useState, useEffect } from 'react';
import { useUpload } from './UploadContext';

const MapColumns = () => {
    // const {
    //     parsedCSV, setParsedCSV,
    //     setFileParsed,
    //     setMapColumns,
    //     setColumnNames,
    //     allowCategorisation,
    // } = useUpload();

    const { state, dispatch } = useUpload();
    
    const [ dateColName, setDateColName ] = useState('');
    const [ descriptionColName, setDescriptionColName ] = useState('');
    const [ accountColName, setAccountColName ] = useState('');
    const [ amountColNames, setAmountColNames ] = useState({col1: "", col2: ""});
    const [ categoryColName, setCategoryColName ] = useState('');
    const [amountMode, setAmountMode] = useState("single");
    const parsedColumnNames = Object.keys(state.parsedCSV[0]);
    const [ checkAmountCol, setCheckAmountCol ] = useState(false);
    const [ errorObject, setErrorObject ] = useState({ field: "", message: "" });
    const [ renderFindAmountDescriptor, setRenderFindAmountDescriptor ] = useState(false);
    const [ amountDescriptorMappings, setAmountDescriptorMappings ] = useState({"income": null, "expense": null});
    const [ descriptorColName, setDescriptorColName ] = useState("");
    const [ dateFormat, setDateFormat ] = useState("");
    
    const saveButtonDisabled = 
        errorObject.field ||
        !dateColName ||
        !dateFormat ||
        !amountColNames.col1 ||
        !descriptionColName ||
        (!state.allowCategorisation && !categoryColName) ||
        (!descriptorColName && renderFindAmountDescriptor);

    useEffect(() => {
        const isAllPositive = (amountCol) => {
            for (let val of amountCol) {
                const number = Number(val);
                if (isNaN(number)) {
                    const message =  `Value '${number}' cannot be converted to a number. Is the column '${amountColNames.col1}' the correct mapping for the amount column?`
                    setErrorObject({field: 'amount', message: message});
                    return false;
                };
                if (number < 0) return false;
                // if (number < 0) return true; // temp
            };
            return true;
        };
        // if there is only 1 amount column
        if (amountColNames.col1 && !amountColNames.col2) {
            const amountColName = amountColNames.col1;
            const amountCol = state.parsedCSV.map(tx => tx[amountColName]);
            
            if (isAllPositive(amountCol)) {
                setCheckAmountCol(true);
            };
        };
    }, [amountColNames]);

    const FindAmountDescriptor = ({ parsedCSV, parsedColumnNames, setAmountDescriptorMappings, setRenderFindAmountDescriptor, setDescriptorColName }) => {
        const [ selectedDescriptorCol, setSelectedDescriptorCol ] = useState('');
        // const [ uniqueDescriptorValues, setUniqueDescriptorValues ] = useState(new Set([]));
        const uniqueDescriptorValues = selectedDescriptorCol
        ? new Set(parsedCSV.map(tx => tx[selectedDescriptorCol]))
        : new Set();

        const [values, setValues] = useState(() => ({ income: new Set(), expense: new Set() }));

        const handleInputOnClick = (e, val) => {
            const type = e.target.value;
            setValues(prev => {
                const newValues = {
                    income: new Set(prev.income),
                    expense: new Set(prev.expense)
                };
                if (type === 'income') {
                    newValues.income.add(val);
                    newValues.expense.delete(val);
                } else if (type === 'expense') {
                    newValues.expense.add(val);
                    newValues.income.delete(val);
                }
                return newValues;
            });
        };

        return (
            <div>
                <div>
                    <label htmlFor='descriptor-col-select' className='mb-2'>Descriptor column</label>
                    <select
                        id="descriptor-col-select"
                        className='p-2 cursor-pointer rounded-lg bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                        onChange={(e) => {
                            setSelectedDescriptorCol(e.target.value);
                        }}
                    >
                        <option value={""}>Select amount descriptor column</option>
                        {parsedColumnNames.map(col => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </select>
                </div>
                {uniqueDescriptorValues.size > 0 && (
                    <div className='bg-black rounded-lg'>
                        <div className=' overflow-y-auto max-h-30'>
                            {[...uniqueDescriptorValues].map(val => (
                                <div key={val} className='flex justify-between gap-y-4 mx-10 p-2'>
                                    <div>{val}</div>
                                    <div className='flex gap-x-2'>
                                        <input 
                                            type='radio'
                                            id='income'
                                            value='income' 
                                            name={val}
                                            checked={values.income.has(val)}
                                            onChange={(e) => handleInputOnClick(e, val)}
                                        />
                                        <label htmlFor='income'>Income</label>
                                        <input
                                            type='radio' 
                                            id='expense' 
                                            value='expense'
                                            name={val}
                                            checked={values.expense.has(val)}
                                            onChange={(e) => handleInputOnClick(e, val)}
                                        />
                                        <label htmlFor='expense'>Expense</label>
                                        <input
                                            type="radio"
                                            name={val}
                                            value="ignore"
                                            checked={!values.income.has(val) && !values.expense.has(val)}
                                            onChange={(e) => handleInputOnClick(e, val)}
                                        />
                                        <label htmlFor='ignore'>Ignore</label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <button
                    onClick={uniqueDescriptorValues.size > 0 ? 
                        () => { 
                            setAmountDescriptorMappings(values);
                            console.log(values);
                            setDescriptorColName(selectedDescriptorCol);
                            setRenderFindAmountDescriptor(false);
                        } 
                        : undefined
                    }
                    disabled={uniqueDescriptorValues.size === 0}
                    className={uniqueDescriptorValues.size > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}
                >
                    Save
                </button>
                <button
                    onClick={() => { 
                        setRenderFindAmountDescriptor(false);
                    }}
                    className='cursor-pointer'
                >
                    Cancel
                </button>
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
                {/* selection grid */}
                <div className='flex flex-col gap-y-4 mt-5'>
                    {/* account selector */}
                    <div className='flex flex-col'>
                        <label htmlFor="account-col-select" className='mb-2'>Transaction account</label>
                        <select 
                            id="account-col-select"
                            className='p-2 cursor-pointer rounded-lg bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                            onChange={(e) => {
                                setAccountColName(e.target.value);
                                if (errorObject.type === 'account') setErrorObject({ field: '', message: '' });
                            }}
                        >
                            <option value={""}>Select account column</option>
                            {parsedColumnNames.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>   
                    </div>
                    {/* date selector */}
                    <div className='flex flex-col'>
                        <div className='w-full flex gap-x-4'>
                            <div className='flex flex-col flex-3'>
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
                            <div className='flex flex-col flex-1'>
                                <label htmlFor="date-format-select" className='mb-2'>Date format</label>
                                <select
                                    id="date-format-select"
                                    className='flex-1 w-full p-2 cursor-pointer rounded-lg bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                                    onChange={(e) => {
                                        setDateFormat(e.target.value);
                                    }}
                                >
                                    <option>Select date format</option>
                                    <option value="EU">EU</option>
                                    <option value="US">US</option>
                                </select>
                            </div>
                        </div>
                        
                    </div>

                    {/* amount selector */}
                    <div className='flex flex-col'>
                        <label htmlFor="amount-col-select" className='mb-2'>Transaction amount</label>
                        <div className='flex gap-x-2 mb-2'>
                            <input type='radio' checked={amountMode === 'single'} id='single' value='single' name="amountColNum" onChange={(e) => {
                                setAmountMode(e.target.value);
                                setAmountColNames({ col1: "", col2: "" });
                                setErrorObject({ field: '', message: '' });
                                setRenderFindAmountDescriptor(false);
                            }}/>
                            <label htmlFor='single'>Single column</label>
                            <input type='radio' id='double' value='double' name="amountColNum" onChange={(e) => {
                                setAmountMode(e.target.value);
                                setAmountColNames({ col1: "", col2: "" });
                                setErrorObject({ field: '', message: '' });
                                setRenderFindAmountDescriptor(false);
                            }}/>
                            <label htmlFor='double'>Income + Expense columns</label>
                        </div>
                        {amountMode === 'single' && (
                            <div>
                                <select
                                    id="amount-col-select"
                                    className='p-2 cursor-pointer rounded-lg bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'
                                    onChange={(e) => {
                                        setAmountColNames(prev => ({...prev, col1: e.target.value}));
                                        if (errorObject.field === 'amount') setErrorObject({ field: '', message: '' });
                                        setRenderFindAmountDescriptor(false);
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
                                        parsedCSV={state.parsedCSV}
                                        parsedColumnNames={parsedColumnNames}
                                        setAmountDescriptorMappings={setAmountDescriptorMappings}
                                        setRenderFindAmountDescriptor={setRenderFindAmountDescriptor}
                                        setDescriptorColName={setDescriptorColName}
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

                    {/* description selector */}
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

                    {/* category selector */}
                    {!state.allowCategorisation && (
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
                        // setParsedCSV([]);
                        dispatch({ type: "SET_PARSED_CSV", payload: [] })
                        // setFileParsed(false);
                        dispatch({ type: "SET_FILE_PARSED", payload: false })
                        // setMapColumns(false);
                        dispatch({ type: "SET_MAP_COLUMNS", payload: false })
                    }}
                    className="bg-[#1a1818] py-2 px-4 rounded hover:bg-black cursor-pointer text-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={
                        saveButtonDisabled ? undefined : 
                        (() => {
                            console.log(
                                `date column: ${dateColName}
                                - amount col: ${JSON.stringify(amountColNames)}
                                - description col: ${descriptionColName}
                                - descriptor col: ${descriptorColName}
                                - amount descriptor mappings: 
                                    income: ${Array.from(amountDescriptorMappings.income ?? [])},
                                    expense: ${Array.from(amountDescriptorMappings.expense ?? [])},
                                - category col: ${categoryColName}`
                            );
                            
                            const parsedCSV = [...state.parsedCSV];
                            const isDescriptorValid = amountDescriptorMappings.income != null || amountDescriptorMappings.expense != null;
                            const data = [];

                            for (let tx of parsedCSV) {
                                const obj = {};
                                const firstAmountColValue = Number(tx[amountColNames.col1]);
                                const secondAmountColValue = Number(tx[amountColNames.col2]);
                                const desc = tx[descriptionColName];
                                const type = tx[descriptorColName];
                                const date = tx[dateColName];
                                const category = tx[categoryColName];
                                const account = tx[accountColName];

                                if (amountColNames.col1 && !amountColNames.col2 && !isDescriptorValid ) { // single amount col
                                    // data.push({ date: date, amount: firstAmountColValue, description: desc });
                                    obj.date = date;
                                    obj.amount = firstAmountColValue;
                                    obj.description = desc;
                                    obj.account = account;
                                }
                                
                                else if (amountColNames.col1 && !amountColNames.col2 && isDescriptorValid) { // 1 amount col with mappings
                                    if (amountDescriptorMappings.income.has(type)) {
                                        // data.push({ date: date, amount: firstAmountColValue, description: desc })
                                        obj.date = date;
                                        obj.amount = firstAmountColValue;
                                        obj.description = desc;
                                        obj.account = account;
                                    }
                                    else if (amountDescriptorMappings.expense.has(type)) {
                                        // data.push({ date: date, amount: firstAmountColValue < 0 ? firstAmountColValue : -firstAmountColValue, description: desc })
                                        obj.date = date;
                                        obj.amount = firstAmountColValue < 0 ? firstAmountColValue : -firstAmountColValue;
                                        obj.description = desc;
                                        obj.account = account;
                                    };
                                } 
                                
                                else if (amountColNames.col1 && amountColNames.col2) { // 2 amount columns (e.g. credit/debit for income and expense)
                                    if (tx[amountColNames.col1]) {
                                        // data.push({ date: date, amount: firstAmountColValue, description: desc });
                                        obj.date = date;
                                        obj.amount = firstAmountColValue;
                                        obj.description = desc;
                                        obj.account = account;
                                        
                                    } else {
                                        // data.push({ date: date, amount: secondAmountColValue < 0 ? secondAmountColValue : -secondAmountColValue, description: desc });
                                        obj.date = date;
                                        obj.amount = secondAmountColValue < 0 ? secondAmountColValue : -secondAmountColValue;
                                        obj.description = desc;
                                        obj.account = account;
                                    };
                                };

                                if (Object.entries(obj).length > 0) {
                                    if (categoryColName) {
                                        obj.category = category;
                                    };
                                    data.push(obj);
                                } else continue;
                            };
                            
                            console.log(data);
                            dispatch({ type: "SET_DATE_FORMAT", payload: dateFormat });
                            dispatch({ type: "SET_TRANSACTIONS", payload: data });
                        })
                    }
                    disabled={saveButtonDisabled}
                    className={
                        saveButtonDisabled ? 
                        "bg-[#1a1818] opacity-55 py-2 px-4 rounded cursor-not-allowed text-sm" : 
                        "bg-[#1a1818] py-2 px-4 rounded hover:bg-black cursor-pointer text-sm"
                    }
                >
                    Continue
                </button>
            </div>
        </div>
    )
};

export default MapColumns;