import { NavBar } from '../components';
import { ReviewDuplicates, PreviewCSV, MapColumns, UploadProgress } from '../components/upload';
import { useCSVReader } from 'react-papaparse';
import React, { useRef, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { MIN_CONF_SCORE, CATEGORIES } from '../utils/constants/constants';
import { db, validateTransaction, makeTransactionId } from '../db/db';
import { useNavigate } from "react-router-dom";
import UploadIcon from '../assets/icons/upload-01-svgrepo-com.svg?react';
import { useUpload } from '../components/upload/UploadContext';
import { getPredictions } from '../api/model';

const CATEGORIES_SET = new Set(CATEGORIES);

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
    const { state, dispatch } = useUpload();

    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={state.allowCategorisation}
                onChange={(e) => dispatch({ type: "SET_ALLOW_CATEGORISATION", payload:e.target.checked })}
            />
            <div className="w-9 h-5 bg-gray-400 rounded-full peer-checked:bg-[#646cff] transition-colors duration-200 ease-in">
                <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in
                ${state.allowCategorisation ? "translate-x-4" : "translate-x-0"}`}
                />
            </div>
        </label>
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

const UploadCSV = ({ getRootProps }) => (
    <div>
        <div className='flex bg-[#1a1818] w-full p-10 rounded-lg mb-5 justify-between'>
            <div>
                <p className='text-white'>Auto-Categorisation</p>
                <p className='text-neutral-400 text-sm'>Automatically categorise transactions based on description content</p>
            </div>
            <Switch />
        </div>
        <div className='bg-[#1a1818] p-8 rounded-lg'>
            <div className='flex flex-col py-40 inset-1 border-1 border-dashed border-neutral-500 hover:border-neutral-600 rounded-lg transition-colors duration-100 ease-in text-center items-center'>
                <UploadIcon className='w-13 h-13 p-2 bg-neutral-300 rounded-full text-black mb-6' />
                <p className='mb-2 text-white'>Drag and drop your CSV file here</p>
                <p className='mb-2 text-neutral-400 text-sm'>or click to browse your files</p>
                <div {...getRootProps()}>
                    <button className='border-1 border-gray-500 rounded-lg py-2 px-4 text-sm cursor-pointer'>Choose CSV file</button>
                </div>
            </div>  
        </div>
    </div>
);

const Upload = () => {
    const { state, dispatch } = useUpload();
    const { CSVReader } = useCSVReader();
    const { getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();
    
    const [ correctionsCount, setCorrectionsCount ] = useState(() => {
            const saved = localStorage.getItem("count");
            if (saved === null) {
                localStorage.setItem("count", "0");
                return 0;
            }
            return parseInt(saved);
    });

    const incrementCorrectionsCount = () => {
        setCorrectionsCount(prevCount => {
            const newCount = prevCount + 1;
            localStorage.setItem("count", newCount.toString());
            return newCount;
        });
    };
    const [ loading, setLoading ] = useState(false);


    const getLowConfTransactions = (transactions, confScores, MIN_CONF_SCORE) => {
        const res = [];
        for (let i = 0; i < transactions.length; i++) {
            if (confScores[i] < MIN_CONF_SCORE) {
                res.push({ ...transactions[i], 'confidence': Math.round(confScores[i] * 100) });
            };
        };

        return res;
    };

    useEffect(() => {
        console.log(state.stage);
    }, [state.stage]);
    
    useEffect(() => {
        const validateAllTransactions = (transactions, dateFormat) =>
            transactions.map((tx, i) => validateTransaction(tx, i, dateFormat));

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

        const handleTransactions = async () => {
            if (state.transactions.length === 0) {
                if (state.stage === "mapColumns") {
                    dispatch({ type: "SET_STAGE", payload: "upload" });
                    console.warn("Uploaded transactions not found");
                };
                return;
            };

            let validatedTransactions = validateAllTransactions(state.transactions, state.dateFormat);

            if (state.allowCategorisation) {
                setLoading(true);
                const res = await getPredictions(validatedTransactions);
                setLoading(false);
                const confidenceScores = res.data.map(tx => tx.confidence);
                validatedTransactions = validatedTransactions.map((tx, i) => ({ ...tx, category: res.data[i].predicted_category }))
                const lowConfTransactions = getLowConfTransactions(validatedTransactions, confidenceScores, MIN_CONF_SCORE);

                dispatch({ type: "SET_CONFIDENCE_SCORES", payload: confidenceScores });
                dispatch({ type: "SET_LOW_CONFIDENCE_TRANSACTIONS", payload: lowConfTransactions });
            };

            // Date range
            const timestamps = validatedTransactions.map(tx => new Date(tx.date).getTime());
            const [minTime, maxTime] = [Math.min(...timestamps), Math.max(...timestamps)];
            const transactionsInRange = await db.barclaysTransactions
                .where('date')
                .between(new Date(minTime), new Date(maxTime), true, true)
                .toArray();


            const absDuplicates = findAbsoluteDuplicates(transactionsInRange, validatedTransactions);
            console.log(transactionsInRange)
            console.log(validatedTransactions);
            const filteredTransactions = validatedTransactions.filter(
                tx => !absDuplicates.some(d => d._id === tx._id)
            );
            console.log(filteredTransactions, validatedTransactions);
            const duplicates = findPossibleDuplicates(transactionsInRange, filteredTransactions);
            const nonDuplicateTransactions = filteredTransactions.filter(
                tx => !duplicates.some(d => d._id === tx._id)
            );

            console.log('absolute dupes', absDuplicates);
            console.log('dupes', duplicates);

            dispatch({ type: "SET_STAGE", payload: "reviewDuplicates" });
            dispatch({ type: "SET_ABSOLUTE_DUPLICATE_ROWS", payload: absDuplicates });
            dispatch({ type: "SET_DUPLICATE_ROWS", payload: duplicates });
            dispatch({ type: "SET_NON_DUPLICATE_ROWS", payload: nonDuplicateTransactions });
        };

        handleTransactions();
    }, [state.transactions]);

    const renderContent = (getRootProps, getRemoveFileProps) => {
        if (state.stage === 'mapColumns') {
            if (loading) {
                return (
                    <div>Loading...</div>
                )
            }
            else return <MapColumns/>

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
            <UploadCSV getRootProps={getRootProps} />
        );
    };
        

    return (
        <>
            <NavBar />
            <div className='flex justify-center content-center w-full mb-20'>
                <div className='flex flex-col justify-center mt-[10%] w-full max-w-[1000px]'>
                    <CSVReader 
                        onUploadAccepted={(results) => {
                            const cleaned = removeErrorRows(results);
                            dispatch({ type: "SET_PARSED_CSV", payload: cleaned });
                            // dispatch({ type: "SET_MAP_COLUMNS", payload: true });
                            dispatch({ type: "SET_STAGE", payload: "mapColumns"})
                        }}
                        config={{ header: true, skipEmptyLines: true }}
                        noDrag
                    >
                        {({
                            getRootProps,
                            acceptedFile,
                            ProgressBar,
                            getRemoveFileProps,
                            Remove,
                        }) => (
                            <>
                                <UploadProgress stage={state.stage} />
                                {renderContent(getRootProps, getRemoveFileProps)}
                            </>
                        )}
                    </CSVReader>
                </div>
            </div>
        </>
    )
}

export default Upload