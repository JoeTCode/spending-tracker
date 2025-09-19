import { NavBar } from '../components';
import { ReviewDuplicates, PreviewCSV, MapColumns } from '../components/upload';
// import { uploadTransactions } from '../api/transactions';
import { useCSVReader } from 'react-papaparse';
import React, { useRef, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { createModel, predict } from '../utils/model';
import { getClientModel, saveClientModel } from '../utils/modelIO';
import { MIN_CONF_SCORE, CATEGORIES, CATEGORY_TO_EMOJI } from '../utils/constants/constants';
import { devGetModelWeights } from '../api/globalModel';
import { db, validateTransaction, makeTransactionId } from '../db/db';
import { pipeline } from '@huggingface/transformers';
import * as tf from '@tensorflow/tfjs';
import { useNavigate } from "react-router-dom";
import UploadIcon from '../assets/icons/upload-01-svgrepo-com.svg?react';
// import Switch from '../components/Switch';
import Warning from '../assets/icons/warning-circle-svgrepo-com.svg?react';
import Tick from '../assets/icons/tick-hollow-circle-svgrepo-com.svg?react';
import CustomProgressBar from '../components/ProgressBar';
import targetCategories from '../data/targetCategories'; // TEMP
import { useUpload } from '../components/upload/UploadContext';
import rules from '../data/rules.json';

const CATEGORIES_SET = new Set(CATEGORIES);

// TEMP


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
            <div className='flex flex-col px-90 py-40 inset-1 border-1 border-dashed border-neutral-500 hover:border-neutral-600 rounded-lg transition-colors duration-100 ease-in text-center items-center'>
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

    // const [ transactions, setTransactions ] = useState([]); // list of dicts
    // const [ lowConfTx, setLowConfTx ] = useState([]);
    // const [ saveData, setSaveData ] = useState([]);
    // const [ duplicateRows, setDuplicateRows ] = useState([]);
    // const [ absoluteDuplicateRows, setAbsoluteDuplicateRows ] = useState([]); 
    // const [ parsedCSV, setParsedCSV ] = useState([]);
    // const [ columnNames, setColumnNames ] = useState([]);

    // const [ fileParsed, setFileParsed ] = useState(false);
    // const [ mapColumns, setMapColumns ] = useState(false);
    // const [ allowCategorisation, setAllowCategorisation ] = useState(true);
    // const [ duplicateWarning, setDuplicateWarning ] = useState(false);
    // const [ previewCSV, setPreviewCSV ] = useState(false);

    // const { 
    //     transactions, setTransactions,
    //     lowConfTx, setLowConfTx,
    //     saveData, setSaveData,
    //     duplicateRows, setDuplicateRows,
    //     absoluteDuplicateRows, setAbsoluteDuplicateRows,
    //     previewCSV, setPreviewCSV,
    //     parsedCSV, setParsedCSV,
    //     setColumnNames,

    //     // booleans
    //     fileParsed, setFileParsed,
    //     allowCategorisation, setAllowCategorisation,
    //     duplicateWarning, setDuplicateWarning,
    //     mapColumns, setMapColumns
    // } = useUpload();

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


    const getLowConfTransactions = (transactions, confScores) => {
        const res = [];
        for (let i = 0; i < transactions.length; i++) {
            if (confScores[i] < MIN_CONF_SCORE) {
                res.push({ ...transactions[i], 'confidence': Math.round(confScores[i] * 100) });
            };
        };

        return res;
    };

    async function categoriseTransactions(formattedTransactions, batchSize = 32) {
        const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
        const predictions = [];
        const confidenceScores = [];
        
        if (state.transactions.length > 0) {
            const timer = new Date().getTime();
            const model = await getClientModel(token);
            // Create a feature-extraction pipeline
            const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

            const transactionsDescriptions = formattedTransactions.map(tx => tx['description'])
            
            for (let i = 0; i < transactionsDescriptions.length; i += batchSize) {
                const batch = transactionsDescriptions.slice(i, i + batchSize);
                const getConfScores = true;
                const [ preds, confScores ] = await predict(model, extractor, batch, getConfScores);
                predictions.push(preds);
                confidenceScores.push(confScores);

                // Yield back to the browser
                await new Promise(r => setTimeout(r, 0));
            };

            console.log(`inference time: ${(new Date().getTime() - timer) / 1000} seconds`);
            
            return [predictions.flat(), confidenceScores.flat()];
        };
    };

    
    useEffect(() => {
        const validateAllTransactions = (transactions, dateFormat) =>
            transactions.map((tx, i) => validateTransaction(tx, i, dateFormat));

        // const categoriseAll = async (transactions) => {
        //     const [predictedCategories, confidenceScores] = await categoriseTransactions(transactions);
        //     // attach categories
        //     transactions.forEach((tx, i) => (tx.category = predictedCategories[i]));
        //     return { transactions, confidenceScores };
        // };

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

        const ruleBasedCategorisation = (transactions, rules) => {
            const categorisedAndUncategorisedTransactions = [];
            const uncategorisedTransactions = [];
            const categorisedTransactions = [];

            for (let tx of transactions) {
                let matched = false;

                for (let row of rules) {
                    if (tx.description.includes(row.company_name)) {
                        categorisedAndUncategorisedTransactions.push({
                            ...tx,
                            category: row.category
                        });
                        categorisedTransactions.push({
                            ...tx,
                            category: row.category
                        });
                        matched = true;
                        break; // stop checking once matched
                    }
                };

                if (!matched) {
                    categorisedAndUncategorisedTransactions.push({ ...tx, category: "Uncategorised" });
                    uncategorisedTransactions.push(tx);
                };
            };

            console.log("rule-based categorisations:", categorisedAndUncategorisedTransactions);
            console.log("remainder:", uncategorisedTransactions);
            console.log("rule-based categorisations:", categorisedTransactions);

            return [ categorisedTransactions, categorisedAndUncategorisedTransactions, uncategorisedTransactions ];
        };

        const handleTransactions = async () => {
            if (!state.mapColumns || state.transactions.length === 0) return;

            let validatedTransactions = validateAllTransactions(state.transactions, state.dateFormat);

            if (state.allowCategorisation) {
                setLoading(true);
                const [ ruleBasedCategorisedTransactions, uncategorisedTransactions ] = ruleBasedCategorisation(validatedTransactions, rules);
                const [ predictedCategories, confidenceScores ] = await categoriseTransactions(uncategorisedTransactions);
                setLoading(false);
                const categorisedTransactions = uncategorisedTransactions.map((tx, i) => ({ ...tx, category: predictedCategories[i] }));
                validatedTransactions = ruleBasedCategorisedTransactions;
                for (let tx of categorisedTransactions) validatedTransactions.push(tx);
                // assumes predicted category is already assigned to validate transactions
                const lowConfTransactions = getLowConfTransactions(categorisedTransactions, confidenceScores);
                // setLowConfTx(lowConfTransactions);
                dispatch({ type: "SET_LOW_CONFIDENCE_TRANSACTIONS", payload: lowConfTransactions });
            };

            // Date range
            const timestamps = validatedTransactions.map(tx => new Date(tx.date).getTime());
            const [minTime, maxTime] = [Math.min(...timestamps), Math.max(...timestamps)];
            const transactionsInRange = await db.barclaysTransactions
                .where('date')
                .between(new Date(minTime), new Date(maxTime), true, true)
                .toArray();

            if (transactionsInRange.length > 0) {
                const absDuplicates = findAbsoluteDuplicates(transactionsInRange, validatedTransactions);
                console.log(transactionsInRange)
                console.log(validatedTransactions);
                const filteredTransactions = validatedTransactions.filter(
                    tx => !absDuplicates.some(d => d._id === tx._id)
                );
                const duplicates = findPossibleDuplicates(filteredTransactions, validatedTransactions);
                const nonDuplicateTransactions = filteredTransactions.filter(
                    tx => !duplicates.some(d => d._id === tx._id)
                );

                console.log('absolute dupes', absDuplicates);

                if (absDuplicates.length || duplicates.length) {
                    // setDuplicateWarning(true);
                    dispatch({ type: "SET_MAP_COLUMNS", payload: false });
                    dispatch({ type: "SET_DUPLICATE_WARNING", payload: true });
                    // setAbsoluteDuplicateRows(absDuplicates);
                    dispatch({ type: "SET_ABSOLUTE_DUPLICATE_ROWS", payload: absDuplicates });
                    // setDuplicateRows(duplicates);
                    dispatch({ type: "SET_DUPLICATE_ROWS", payload: duplicates });
                    dispatch({ type: "SET_NON_DUPLICATE_ROWS", payload: nonDuplicateTransactions });
                    // setSaveData(validatedTransactions.filter(tx => !duplicates.includes(tx)));
                    // dispatch({ type: "SET_SAVE_DATA", payload: validatedTransactions.filter(tx => !duplicates.includes(tx)) });
                    // setPreviewCSV(false);
                    dispatch({ type: "SET_PREVIEW_CSV", payload: false });
                    return;
                }
            }

            if (state.allowCategorisation) {
                // setSaveData(validatedTransactions);
                dispatch({ type: "SET_SAVE_DATA", payload: validatedTransactions })
                dispatch({ type: "SET_MAP_COLUMNS", payload: false });
                dispatch({ type: "SET_PREVIEW_CSV", payload: true });
                dispatch({ type: "SET_FILE_PARSED", payload: true });
            } else {
                await db.barclaysTransactions.bulkAdd(validatedTransactions);
                navigate('/dashboard');
            }
        };

        handleTransactions();
    }, [state.transactions]);

    const renderContent = (getRootProps, getRemoveFileProps) => {
        if (state.mapColumns) {
            return loading ?
                <div>Loading...</div> : <MapColumns/>
        };
        if (state.duplicateWarning) {
            return (
                <ReviewDuplicates getRemoveFileProps={getRemoveFileProps} />
            );
        };

        if (state.previewCSV) {
            return (
                <PreviewCSV />
            )
        };

        return (
            <UploadCSV getRootProps={getRootProps} />
        );
    };
        

    return (
        <>
            <NavBar />
            
            <div className='flex justify-center mt-[20%] '>
                <CSVReader 
                    onUploadAccepted={(results) => {
                        const cleaned = removeErrorRows(results);

                        // setParsedCSV(cleaned);
                        dispatch({ type: "SET_PARSED_CSV", payload: cleaned });
                        // setFileParsed(true);
                        dispatch({ type: "SET_FILE_PARSED", payload: true });
                        // setMapColumns(true);
                        dispatch({ type: "SET_MAP_COLUMNS", payload: true });
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
                            {renderContent(getRootProps, getRemoveFileProps)}
                        </>
                    )}
                </CSVReader>
            </div>
            
        </>
    )
}

export default Upload