import { NavBar } from '../components';
import { ReviewDuplicates, PreviewCSV, MapColumns, UploadProgress } from '../components/upload';
import { useCSVReader, formatFileSize } from 'react-papaparse';
import { useState, useEffect } from 'react';
import { MIN_CONF_SCORE } from '../utils/constants/constants';
import { db, validateTransaction, makeTransactionId } from '../db/db';
import UploadIcon from '../assets/icons/upload-01-svgrepo-com.svg?react';
import { useUpload } from '../components/upload/UploadContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Close from '../assets/icons/close-svgrepo-com.svg?react';
import { usePage } from './PageContext';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../axios/api';
import Brain from '../assets/icons/brain-solid-svgrepo-com.svg?react';
import { useInternalAuth } from '../components/useInternalAuth';

function formatDescription(desc) {
    let formattedDesc = String(desc).split('\t')[0].trim();
    formattedDesc = formattedDesc.replace(/\s+/g, ' ').trim();
    return formattedDesc;
};

function formatDate(date) {
    // input format (String) DD/MM/YYYY
    // convert to ISO YYYY-MM-DD
    const [ day, month, year ] = date.split("/");
    const dateString = `${year}-${month}-${day}`;
    return new Date(dateString);
}

const Switch = ()  => {
    const { state: pageState, dispatch: pageDispatch } = usePage();

    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={pageState.allowCategorisation}
                onChange={(e) => {
                    pageDispatch({ type: "SET_ALLOW_CATEGORISATION", payload: e.target.checked });
                }}
            />
            <div className="w-9 h-5 bg-gray-400 rounded-full peer-checked:bg-[#646cff] transition-colors duration-200 ease-in">
                <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in
                ${pageState.allowCategorisation ? "translate-x-4" : "translate-x-0"}`}
                />
            </div>
        </label>
    );
};

const LoadingOverlay = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
    </div>
  );
};

const removeErrorRows = (parsedCSV) => {
    let invalidRows = new Set([]);
    const errorRows = parsedCSV.errors.flat();
    if (errorRows > 0) {
        for (let tx of errorRows) {
            invalidRows.add(tx.row);
        };
    };
    return parsedCSV.data.filter((_, idx) => !invalidRows.has(idx));
};

const formatBarclaysCSV = (parsedCSV, allowCategorisation) => {
    console.log(parsedCSV);
    let invalidRows = new Set([]);
    if (parsedCSV.errors.length > 0) {
        for (let tx of parsedCSV.errors[0]) {
            invalidRows.add(tx.row);
        };
    };
    const validData = parsedCSV.data.filter((_, idx) => !invalidRows.has(idx));
    console.log(invalidRows, validData);
    return validData.map(tx => {
        const amount = parseFloat(tx['Amount']) ? parseFloat(tx['Amount']) : 0;
        if (allowCategorisation) {
            return {
                'account': tx['Account'],
                'amount': amount,
                'date': formatDate(tx['Date']),
                'description': formatDescription(tx['Memo']),
                'type': tx['Subcategory']                        
            };
        } else {
            return {
                'account': tx['Account'],
                'amount': amount,
                'date': formatDate(tx['Date']),
                'category': tx['Category'],
                'description': formatDescription(tx['Memo']),
                'type': tx['Subcategory']                        
            };
        };
    })
    .filter(tx => tx['description'] && tx['description'] !== "undefined" && !isNaN(tx['amount']));
};

const logModelAccuracy = (targetCategories, predictedCategories) => {
    let numMatches = 0;
    const targets = Object.values(targetCategories);
    for (let i = 0; i < predictedCategories.length; i++) {
        if (predictedCategories[i] === targets[i]) {
            numMatches += 1;
        };
    };

    console.log('Score:', (numMatches*100)/predictedCategories.length);
};

const UploadCSV = ({ getRootProps, acceptedFile, ProgressBar, getRemoveFileProps, isLoading, parsedCSV, dispatch }) => {
    const [ filename, setFilename ] = useState(new Date().toUTCString());
    const [ selectedModel, setSelectedModel ] = useState("globalModel");
    const { state: pageState, dispatch: pageDispatch } = usePage();

    useEffect(() => {
        if (acceptedFile) setFilename(acceptedFile.name);
    }, [acceptedFile])

    const onFileNameChange = (value) => {
        setFilename(value);
    };

    const getUniqueCsvFilename = async (filename) => {
        let baseName = filename;
        let counter = 1;
        let uniqueName = baseName;

        // get all CSV names already in the database
        const existingNames = (await db.csvData.toArray()).map(tx => tx.name);
        console.log(existingNames);
        while (existingNames.includes(uniqueName)) {
            uniqueName = `${baseName} (${counter})`;
            counter++;
        };
        console.log('filename', uniqueName);
        return uniqueName;
    };
    
    const validateFileName = async (filename) => {
        let parsedFilename = filename;

        // check if file name was renamed to empty string
        if (!filename) parsedFilename = new Date().toUTCString();

        // check if file name exists in db
        const uniqueFilename = await getUniqueCsvFilename(parsedFilename);
        return uniqueFilename;
    };

    const handleFileUpload = async () => {
        if (parsedCSV.length > 0) {
            const validatedFilename = await validateFileName(filename);
            dispatch({ type: "SET_CSV_FILENAME", payload: validatedFilename });
            dispatch({ type: "SET_PARSED_CSV", payload: parsedCSV });
            dispatch({ type: "SET_STAGE", payload: "mapColumns"})
        }
        // toast here
        else console.warn("CSV failed to parse");
    };

    return (
        <div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full">
                            <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h4 className='font-medium text-purple-900 dark:text-purple-100'>AI Model Selection</h4>
                            <p className='text-sm text-purple-700 dark:text-purple-300'>Choose your model</p>
                        </div>
                    </div>
                    <div>
                        <select 
                            defaultValue={pageState.modelType}
                            onChange={(e) => {
                                pageDispatch({ type: "SET_MODEL_TYPE", payload: e.target.value });
                            }}
                            className='bg-purple-100 dark:bg-purple-600/10 rounded-lg p-2 text-purple-700 dark:text-purple-100'
                        >
                            <option value="globalModel">Global</option>
                            <option value="clientModel">Personalised</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className='mt-5 flex bg-[#1a1818] w-full p-10 rounded-lg mb-5 justify-between'>
                <div>
                    <p className='text-white'>Auto-Categorisation</p>
                    <p className='text-neutral-400 text-sm'>Automatically categorise transactions based on description content</p>
                </div>
                <Switch />
            </div>

            <div className='bg-[#1a1818] p-8 rounded-lg min-h-[500px]'>

                        <div 
                            className='
                                flex flex-col justify-center inset-1 border-1 border-dashed
                                border-neutral-500 hover:border-neutral-600 rounded-lg transition-colors
                                duration-100 ease-in text-center items-center min-h-[500px]
                            '
                            {...getRootProps()}
                            onClick={(e) => e.stopPropagation()} 
                        >
                            {acceptedFile ? (
                                <div className='justify-center'>
                                    <div className='flex flex-col border-1 border-neutral-600 rounded-lg p-4'>
                                        <div className='flex justify-between gap-x-10'>
                                            <input onChange={(e) => onFileNameChange(e.target.value)} defaultValue={acceptedFile.name} type='text' id='filename' name='filename' className='text-sm w-60 px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400' />
                                            <Close className="h-5 w-5 m-2 cursor-pointer hover:bg-neutral-600 rounded-lg" {...getRemoveFileProps()} />
                                        </div>
                                        <span className='px-2 text-sm text-neutral-600 self-start'>{formatFileSize(acceptedFile.size)}</span>
                                        <div className='h-1 mt-1'>
                                            <ProgressBar style={{ height:'80%', width: '100%', backgroundColor: '#646cff' }} />
                                        </div>

                                        <button 
                                            className={
                                                isLoading ? 
                                                'text-sm bg-black opacity-20 rounded-lg py-1 mt-1 cursor-not-allowed' :
                                                'text-sm bg-black rounded-lg py-1 mt-1 cursor-pointer'
                                            }
                                            onClick={isLoading ? undefined : handleFileUpload}
                                        >
                                            Upload
                                        </button>

                                    </div>
                                </div>

                            ) : 
                            (
                                <>
                                    <UploadIcon className='w-13 h-13 p-2 bg-neutral-300 rounded-full text-black mb-6' />
                                    <p className='mb-2 text-white'>Drag and drop your CSV file here</p>
                                    <p className='mb-2 text-neutral-400 text-sm'>or click to browse your files</p>
                                    
                                    <div {...getRootProps()}>
                                        <button className='border-1 border-gray-500 rounded-lg py-2 px-4 text-sm cursor-pointer'>Choose CSV file</button>
                                    </div>
                                </>
                            )}
                        </div>
            </div>
        </div>
    )
};

const Upload = () => {
    const { state, dispatch } = useUpload();
    const { state: pageState, dispatch: pageDispatch } = usePage();
    
    const { user: internalUser } = useInternalAuth(); 
    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

    const { CSVReader } = useCSVReader();
    const [ isLoading, setIsLoading ] = useState(true);
    const [ parsedCSV, setParsedCSV ] = useState([]);
    

    const getLowConfTransactions = (transactions, confScores, MIN_CONF_SCORE) => {
        const res = [];
        for (let i = 0; i < transactions.length; i++) {
            if (confScores[i] < MIN_CONF_SCORE) {
                res.push({ ...transactions[i], 'confidence': Math.round(confScores[i] * 100) });
            };
        };

        return res;
    };

    const findDuplicates = async (updatedTransactions) => {

        const findAbsoluteDuplicates = (dbTxs, newTxs) => {
            const dbIdSet = new Set(dbTxs.map(tx => tx._id));
            return newTxs.filter((tx, i) =>
                dbIdSet.has(makeTransactionId({ row: i, ...tx }))
            );
        };

        const findPossibleDuplicates = (dbTxs, newTxs) => {
            const dbFieldHashes = new Set(dbTxs.map(tx =>
                makeTransactionId({ ...tx })
            ));
            return newTxs.filter(tx => dbFieldHashes.has(makeTransactionId({ ...tx })));
        };

        // Date range
        const timestamps = updatedTransactions.map(tx => new Date(tx.date).getTime());
        const [minTime, maxTime] = [Math.min(...timestamps), Math.max(...timestamps)];
        const transactionsInRange = await db.transactions
            .where('date')
            .between(new Date(minTime), new Date(maxTime), true, true)
            .toArray();


        const absDuplicates = findAbsoluteDuplicates(transactionsInRange, updatedTransactions);
        const filteredTransactions = updatedTransactions.filter(
            tx => !absDuplicates.some(d => d._id === tx._id)
        );

        const duplicates = findPossibleDuplicates(transactionsInRange, filteredTransactions);
        const nonDuplicateTransactions = filteredTransactions.filter(
            tx => !duplicates.some(d => d._id === tx._id)
        );

        dispatch({ type: "SET_STAGE", payload: "reviewDuplicates" });
        dispatch({ type: "SET_ABSOLUTE_DUPLICATE_ROWS", payload: absDuplicates });
        dispatch({ type: "SET_DUPLICATE_ROWS", payload: duplicates });
        dispatch({ type: "SET_NON_DUPLICATE_ROWS", payload: nonDuplicateTransactions });
    };


    useEffect(() => {
        if (state.transactions.length === 0) {
            if (state.stage === "mapColumns") {
                dispatch({ type: "SET_STAGE", payload: "upload" });
                console.warn("Uploaded transactions not found");
            };
            
            return;
        };

        const validateAllTransactions = (transactions, dateFormat) =>
            transactions.map((tx, i) => validateTransaction(tx, i, dateFormat));

        const handleTransactions = async () => {
            const validatedTransactions = validateAllTransactions(state.transactions, state.dateFormat);

            if (validatedTransactions.length === 0) {
                dispatch({ type: "SET_LOADING", payload: false });
                dispatch({ type: "SET_STAGE", payload: "upload" });
                return;
            };

            if (!pageState.allowCategorisation) {
                dispatch({ type: "SET_LOADING", payload: false });
                findDuplicates(validatedTransactions);
                toast.success("Categorisation skipped");
                return;
            };

            try {
                const descriptions = validatedTransactions.map(tx => tx.description);

                // const res = await getPredictions(descriptions);
                const token = isAuthenticated ? await getAccessTokenSilently() : '';

                const res = await api.post(
                    "/predict",
                    { 
                        descriptions: descriptions,
                        modelType: pageState.modelType,
                        uid: isAuthenticated ? null : internalUser.uid 
                    }, 
                    { 
                        headers: { "authorization": `Bearer ${token}` },
                        withCredentials: true
                    },
                );
                console.log(res);

                if (!res || !res.data || res.data.length === 0) { // api call failed
                    dispatch({ type: "SET_TRANSACTIONS", payload: [] });
                    dispatch({ type: "SET_STAGE", payload: "upload" });
                    dispatch({ type: "SET_LOADING", payload: false });
                    toast.error("Categorisation failed");
                    return;
                };

                const updatedTransactions = validatedTransactions.map((tx, i) => ({
                     ...tx, 
                     category: res.data[i].predicted_category 
                }));

                const confidenceScores = res.data.map(tx => tx.confidence);
                const lowConfTransactions = getLowConfTransactions(
                    updatedTransactions,
                    confidenceScores,
                    MIN_CONF_SCORE
                );
              
                dispatch({ type: "SET_CONFIDENCE_SCORES", payload: confidenceScores });
                dispatch({ type: "SET_LOW_CONFIDENCE_TRANSACTIONS", payload: lowConfTransactions });
                dispatch({ type: "SET_LOADING", payload: false });

                findDuplicates(updatedTransactions);
                toast.success("Categorisation successfully completed!");
            } catch (err) {
                console.error(err);
                dispatch({ type: "SET_LOADING", payload: false });
                toast.error("Categorisation failed");
            };
        };

        handleTransactions()
    }, [state.transactions])

    const renderContent = (getRootProps, acceptedFile, ProgressBar, getRemoveFileProps, parsedCSV) => {

        if (state.stage === 'mapColumns') {
            if (state.loading) {
                return <LoadingOverlay loading={state.loading} />
            } else return <MapColumns/>
        };

        if (state.stage === 'reviewDuplicates') {
            return (
                <>
                    <ReviewDuplicates getRemoveFileProps={getRemoveFileProps} />
                </>                
            );
        };

        if (state.stage === 'review') {
            return (
                <>
                    <PreviewCSV />
                </>                
            );
        };
        
        return (
            
            <UploadCSV 
                getRootProps={getRootProps} acceptedFile={acceptedFile} ProgressBar={ProgressBar} 
                getRemoveFileProps={getRemoveFileProps} isLoading={isLoading} parsedCSV={parsedCSV}
                dispatch={dispatch}
            />
        );
    };
        

    return (
        <>
            <NavBar />
            <div className='flex justify-center content-center w-full mb-20'>
                <div className='flex flex-col justify-center mt-[10%] w-full max-w-[1000px]'>
                    <CSVReader 
                        onUploadAccepted={(results) => {
                            setIsLoading(false);
                            const cleaned = removeErrorRows(results)
                            // .filter(tx => tx['description'] && tx['description'] !== "undefined" && !isNaN(tx['amount']));
                            setParsedCSV(cleaned);
                            // dispatch({ type: "SET_PARSED_CSV", payload: cleaned });
                            // dispatch({ type: "SET_STAGE", payload: "mapColumns"})
                        }}
                        config={{ header: true, skipEmptyLines: true }}
                    >
                        {({
                            getRootProps,
                            acceptedFile,
                            ProgressBar,
                            getRemoveFileProps
                        }) => (
                            <>
                                <UploadProgress stage={state.stage} />
                                {renderContent(getRootProps, acceptedFile, ProgressBar, getRemoveFileProps, parsedCSV)}
                            </>
                        )}
                    </CSVReader>
                </div>
            </div>
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                toastClassName={() =>
                    "p-4 bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg shadow-lg flex"
                }
                bodyClassName="text-sm font-medium"
                progressClassName="bg-purple-500 dark:bg-purple-300"
                closeButton={({ closeToast }) => (
                    <Close 
                        onClick={closeToast}
                        className='
                            relative bottom-[9px] left-[10px] h-4 w-4 text-gray-500 dark:text-gray-300 hover:text-gray-700
                            dark:hover:text-gray-500 cursor-pointer duration-300 ease-out
                        '
                    />

                )}
            />
        </>
    )
}

export default Upload