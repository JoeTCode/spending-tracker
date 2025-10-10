import { useState, useEffect } from 'react';
import { useUpload } from './UploadContext';
import { usePage } from '../../pages/PageContext';
import ShowMore from '../../assets/icons/expand-more-alt-svgrepo-com.svg?react';
import ShowLess from '../../assets/icons/expand-less-alt-svgrepo-com.svg?react';
import { db } from '../../db/db';
import { v4 as uuidv4 } from 'uuid';
import Trash from '../../assets/icons/trash-01-svgrepo-com.svg?react';
import { toast } from 'react-toastify';

const MapColumns = () => {
    const { state, dispatch } = useUpload();
    const { state: pageState, dispatch: pageDispatch } = usePage();

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
    const [ showMoreSavedMappings, setShowMoreSavedMappings ] = useState(() => {
        return localStorage.getItem("showMoreSavedMappings") === "true" && true
    });
    const [ showMoreMappings, setShowMoreMappings ] = useState(() => {
        return localStorage.getItem("showMoreMappings") === "true" && true
    });
    const [ savedMappings, setSavedMappings ] = useState([]);
    const [ mappingTitle, setMappingTitle ] = useState("");
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let selectorStyle = "cursor-pointer rounded-lg border border-neutral-200 dark:border-none dark:bg-black dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400";
    
    const saveButtonDisabled = 
        errorObject.field ||
        !dateColName ||
        !dateFormat ||
        !amountColNames.col1 ||
        !descriptionColName ||
        (!pageState.allowCategorisation && !categoryColName) ||
        (!descriptorColName && renderFindAmountDescriptor);
    
    const saveMappingDisabled =
        errorObject.field ||
        !dateColName ||
        !dateFormat ||
        !amountColNames.col1 ||
        !descriptionColName ||
        (!pageState.allowCategorisation && !categoryColName) ||
        (!descriptorColName && renderFindAmountDescriptor) ||
        !mappingTitle;

    useEffect(() => {
        const getMappings = async () => {
            const allSavedMappings = await db.savedMappings.toArray();
            setSavedMappings(allSavedMappings);
        };
        
        getMappings();
    }, [])

    const getCSVDataFromMappings = (accountColName, amountColNames, descriptorColName, amountDescriptorMappings, descriptionColName, dateColName, categoryColName ) => {
        const parsedCSV = [...state.parsedCSV];

        const isDescriptorValid = amountDescriptorMappings?.income != null || amountDescriptorMappings?.expense != null;
        const data = [];

        for (let tx of parsedCSV) {
            const obj = {};
            const firstAmountColValue = Number(tx[amountColNames?.col1]);
            const secondAmountColValue = Number(tx[amountColNames?.col2]);
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
                    obj.date = date;
                    obj.amount = firstAmountColValue;
                    obj.description = desc;
                    obj.account = account;
                }
                else if (amountDescriptorMappings.expense.has(type)) {
                    obj.date = date;
                    obj.amount = firstAmountColValue < 0 ? firstAmountColValue : -firstAmountColValue;
                    obj.description = desc;
                    obj.account = account;
                };
            } 
            
            else if (amountColNames.col1 && amountColNames.col2) { // 2 amount columns (e.g. credit/debit for income and expense)
                if (tx[amountColNames.col1]) {
                    obj.date = date;
                    obj.amount = firstAmountColValue;
                    obj.description = desc;
                    obj.account = account;
                    
                } else {
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

                obj.is_trainable = true;
                obj.trained = false;
                data.push(obj);

            } else continue;
        };

        return data.filter(tx => tx['description'] && tx['description'] !== "undefined" && !isNaN(tx['amount']));;
    };

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
                        className={selectorStyle += ' p-2'}
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
        <div className='w-full'>
            <div className='border border-neutral-300 rounded-lg dark:border-none dark:bg-dark w-full p-10'>
                <div className=''>
                    <p>Map CSV columns</p>
                    <p className='mb-6 text-sm text-neutral-400'>Map your CSV columns to the required transaction fields</p>
                </div>
                <div className='w-full rounded-lg'>

                    {/* Saved mappings expandable div */}

                    <div 
                        className='flex w-full h-full justify-between items-center cursor-pointer mb-4'
                        onClick={() => {
                            setShowMoreSavedMappings(prev => {
                                localStorage.setItem("showMoreSavedMappings", !prev);
                                return !prev;
                            });
                        }}
                    >
                        <p>Saved mappings</p>
                        {showMoreSavedMappings ? ( 
                            <ShowMore className='w-5 h-5 text-neutral-500 dark:text-white' />
                        ) : (
                            <ShowLess className='w-5 h-5 text-neutral-500 dark:text-white' />
                        )}
                    </div>

                    <div className={showMoreSavedMappings ? 'mb-6': 'hidden'}>
                        <div>
                            {savedMappings.map(mapping => {
                                return (
                                    <div 
                                        key={mapping._id}
                                        className='w-full flex flex-1 justify-between items-center py-2 px-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-black rounded-lg'
                                        onClick={async () => {
                                            try {
                                                await new Promise(resolve => setTimeout(resolve, 0));

                                                const data = getCSVDataFromMappings(
                                                    mapping.account,
                                                    mapping.amount, 
                                                    mapping.amountDescriptor, 
                                                    mapping.amountMappings,
                                                    mapping.description, 
                                                    mapping.date, 
                                                    mapping.category
                                                );
                                                
                                                dispatch({ type: "SET_LOADING", payload: true });
                                                dispatch({ type: "SET_DATE_FORMAT", payload: mapping.dateFormat });
                                                dispatch({ type: "SET_TRANSACTIONS", payload: data });
                                            } catch (err) {
                                                toast.error("Something went wrong!");
                                                dispatch({ type: "SET_STAGE", payload: "upload" });
                                            }
                                        }}
                                    >
                                        <span>{mapping.mappingTitle}</span>
                                        <div className='hover:bg-red-300/50 text-neutral-500 dark:text-neutral-400 hover:text-red-700 rounded-full w-7 h-7 justify-center items-center flex cursor-pointer'>
                                            <Trash className='w-5 h-5' />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Mappings expandable div */}
                    <div 
                        className='flex w-full h-full justify-between items-center cursor-pointer'
                        onClick={() => {
                            setShowMoreMappings(prev => {
                                localStorage.setItem("showMoreMappings", !prev);
                                return !prev;
                            });
                        }}
                    >
                        <p>Set mappings</p>
                        {showMoreMappings ? (
                            <ShowMore className='w-5 h-5 text-neutral-500 dark:text-white' />
                        ): (
                            <ShowLess className='w-5 h-5 text-neutral-500 dark:text-white' />
                        )}                        
                    </div>
                    
                    <div
                        className={showMoreMappings ? '': 'hidden'}
                    >
                        {errorObject.field && (
                            <div className='bg-red-400 py-10 px-5 text-center'>
                                {errorObject.message}
                            </div>
                        )}
                        {/* selection grid */}
                        <div className='flex flex-col gap-y-4 mt-5'>
                            <div className='flex flex-col'>
                                <label htmlFor='mappingTitle'>Mapping Title</label>
                                <input 
                                    type="text" 
                                    id="mappingTitle" 
                                    name="mappingTitle" 
                                    onChange={(e) => setMappingTitle(e.target.value)}
                                    className={selectorStyle += ' p-1'}
                                />
                            </div>
                            {/* account selector */}
                            <div className='flex flex-col'>
                                <label htmlFor="account-col-select" className='mb-2'>Transaction account</label>
                                <select 
                                    id="account-col-select"
                                    className={selectorStyle += ' p-2'}
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
                                            className={selectorStyle += ' p-2'}
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
                                            className={selectorStyle += ' flex-1 w-full p-2'}
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
                                            className={selectorStyle += ' p-2'}
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
                                            className={selectorStyle += ' p-2'}
                                            onChange={(e) => setAmountColNames(prev => ({...prev, col1: e.target.value}))}
                                        >
                                            <option value={""}>Select income column</option>
                                            {parsedColumnNames.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                        <select
                                            id="amount-col-select"
                                            className={selectorStyle += ' p-2'}
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
                                    className={selectorStyle += ' p-2'}
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
                            {!pageState.allowCategorisation && (
                                <div className='flex flex-col'>
                                    <label htmlFor="category-col-select">Transaction category</label>
                                    <select
                                        id="category-col-select"
                                        className={selectorStyle += ' p-2'}
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

                            <button
                                className={saveMappingDisabled ? 
                                    "bg-dark text-white opacity-55 py-2 px-4 rounded cursor-not-allowed text-sm" : 
                                    "bg-dark text-white py-2 px-4 rounded hover:bg-dark-light dark:bg-purple dark:hover:bg-dark-purple cursor-pointer text-sm"
                                }
                                onClick={saveMappingDisabled ? undefined : (async () => {

                                    await db.savedMappings.add({ 
                                        _id: uuidv4(), 
                                        mappingTitle: mappingTitle,
                                        date: dateColName,
                                        account: accountColName, 
                                        amount: amountColNames,
                                        amountDescriptor: descriptionColName,
                                        amountMappings: amountDescriptorMappings,
                                        description: descriptionColName,
                                        category: categoryColName,
                                        dateFormat: dateFormat
                                    })
                                })}
                                disabled={saveMappingDisabled}
                            >
                                Save Mapping
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className='mt-2 flex justify-end gap-2'>
                <button 
                    onClick={() => {
                        dispatch({ type: "SET_PARSED_CSV", payload: [] });
                        dispatch({ type: "SET_STAGE", payload: "upload"});
                    }}
                    className="text-white bg-dark py-2 px-4 rounded hover:bg-black cursor-pointer text-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={
                        saveButtonDisabled ? undefined : 
                        (
                            async () => {
                                try {
                                    await new Promise(resolve => setTimeout(resolve, 0));
                                    const data = getCSVDataFromMappings(
                                        accountColName, 
                                        amountColNames,
                                        descriptorColName, 
                                        amountDescriptorMappings, 
                                        descriptionColName, 
                                        dateColName, 
                                        categoryColName
                                    );

                                    dispatch({ type: "SET_LOADING", payload: true });
                                    
                                    dispatch({ type: "SET_DATE_FORMAT", payload: dateFormat });
                                    dispatch({ type: "SET_TRANSACTIONS", payload: data });
                                } catch (err) {
                                    toast.error("Something went wrong!");
                                    dispatch({ type: "SET_STAGE", payload: "upload" });
                                }
                            }
                        )
                    }
                    disabled={saveButtonDisabled}
                    className={
                        saveButtonDisabled ? 
                        "text-white bg-dark opacity-55 py-2 px-4 rounded cursor-not-allowed text-sm" : 
                        "text-white bg-dark py-2 px-4 rounded hover:bg-black cursor-pointer text-sm"
                    }
                >
                    Continue
                </button>
            </div>
        </div>
    )
};

export default MapColumns;