import { NavBar, EditableGrid } from '../components';
import { uploadTransactions } from '../api/transactions';
import { useCSVReader } from 'react-papaparse';
import React, { useRef, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { createModel, predict } from '../utils/model';
import { getClientModel, saveClientModel } from '../utils/modelIO';
import { MIN_CONF_SCORE, CATEGORIES } from '../utils/constants/constants';
import { devGetModelWeights } from '../api/globalModel';

function formatDescription(desc) {
    let formattedDesc = String(desc).split('\t')[0].trim();
    formattedDesc = formattedDesc.replace(/\s+/g, ' ').trim();
    return formattedDesc;
}

const Upload = () => {
    const { CSVReader } = useCSVReader();
    const [ transactions, setTransactions ] = useState([]); // list of dicts
    const { getAccessTokenSilently } = useAuth0();
    const [ previewCSV, setPreviewCSV ] = useState(false);
    const [ lowConfTx, setLowConfTx ] = useState([]);
    const [ headers, setHeaders ] = useState(null);
    const [ saveData, setSaveData ] = useState([]);
    const gridRef = useRef(null);
    const [ token, setToken ] = useState(async () => {
        const tken = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
        setToken(tken);        
    });
    const [correctionsCount, setCorrectionsCount] = useState(() => {
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

    const CATEGORIES_SET = new Set(CATEGORIES);

    const formatTransactions = (transactions, keepCols, amountCol, descriptionCol) => {
        const cols = Object.values(transactions[0]); // array of col names
        const desc_idx = cols.indexOf(descriptionCol);
        const amount_idx = cols.indexOf(amountCol);
        const keepColsToIdx = {}
        for (let i = 0; i < cols.length; i ++) {
            const col = cols[i];
            if (keepCols.find(el => el == col)) {
                keepColsToIdx[cols[i]] = i;
            };
        };
        
        const formattedTransactions = transactions.slice(1); // remove cols
        return formattedTransactions.map(tx => {
            const amount = parseFloat(tx[amount_idx]) ? parseFloat(tx[amount_idx]) : 0;
            tx[amount_idx] = amount;
            tx[desc_idx] = formatDescription(tx[desc_idx]);
            const obj = {};
            for (let col of keepCols) {
                obj[col] = tx[keepColsToIdx[col]];
            };
            obj["_id"] = tx["_id"]
            return obj
        })
        .filter(tx => tx[descriptionCol] && tx[descriptionCol] !== "undefined" && !isNaN(tx[amountCol]));
    };

    const getLowConfTransactions = (transactions, predictedCategories, confScores) => {
        const res = [];
        for (let i = 0; i < transactions.length; i++) {
            if (confScores[i] < MIN_CONF_SCORE) {
                res.push({ ...transactions[i], 'Category': predictedCategories[i], 'Confidence': Math.round(confScores[i] * 100) });
            };
        };

        return res;
    }

    useEffect(() => {
        const categoriseTransactions = async (token, formattedTransactions) => {
            if (transactions.length > 0) {
                
                const model = await getClientModel(token);
                const transactionsDescriptions = formattedTransactions.map(tx => tx['Memo'])

                const getConfScores = true;
                const [ predictions, confidenceScores ] = await predict(model, transactionsDescriptions, getConfScores);
                return [predictions, confidenceScores];
            };
        };

        const createCSVPreview = async () => {
            if (transactions.length > 0) {
                const formattedTransactions = formatTransactions(transactions, [ "_id", "Date", "Account", "Amount", "Subcategory", "Memo" ], "Amount", "Memo");
                const [ predictedCategories, confidenceScores ] = await categoriseTransactions(token, formattedTransactions);                
                
                const lowConfTransactions = getLowConfTransactions(formattedTransactions, predictedCategories, confidenceScores);
                const headers = Object.keys(lowConfTransactions[0]);
                const reordered = ["Confidence", "Category", ...headers.filter(col => col !== "Category" && col !== "Confidence")];
                setLowConfTx(lowConfTransactions);
                
                
                setHeaders(() => {
                    const formatted = [];
                    
                    for (let header of reordered) {
                        const obj = {};
                        if (header === '_id') {
                            continue;
                        }
                        if (header === 'Confidence') {
                            obj['field'] = header;
                            obj['editable'] = true;
                            obj['width'] = 120
                            obj['valueFormatter'] = params => {
                                if (params.value == null) return '';
                                return `${params.value}%`;
                            };
                        };
                        if (header === 'Date') {
                            obj['field'] = header;
                            obj['editable'] = true;
                            obj['width'] = 120
                        }
                        if (header === 'Amount') {
                            obj['field'] = header;
                            obj['editable'] = true;
                            obj['width'] = 120
                        }
                        else if (header === 'Category') {
                            obj['field'] = header;
                            obj['editable'] = true; // <-- must be true
                            obj['cellEditor'] = 'agSelectCellEditor';
                            obj['cellEditorParams'] = {
                                values: CATEGORIES
                            };
                        } else {
                            obj['field'] = header;
                            obj['editable'] = true;
                        };

                        formatted.push(obj);
                    };

                    return formatted;
                });

                setPreviewCSV(true);
                const saveData = formattedTransactions.map((tx, i) => ({
                    ...tx,
                    'Category': predictedCategories[i]
                }));
                console.log(saveData);
                setSaveData(saveData);
                
            };
        };

        createCSVPreview();
    }, [transactions]);


    const sendData = async () => {
        await uploadTransactions(token, saveData);
    };


    const handleCellChange = (updatedRow, params) => {
        setLowConfTx(prev =>
            prev.map(row => row._id === updatedRow._id ? updatedRow : row)
        );

        const column = params.column.colId;
        if (column === 'Category') {
            console.log(correctionsCount);
            if (CATEGORIES_SET.has(updatedRow[column])) {
                incrementCorrectionsCount();
            };
        };
    };

    return (
        <>
            <NavBar />
            {previewCSV ? (
                <h2>Review low-confidence predictions</h2>
            ) : (
                <h1>Upload</h1>
            )}
            
            <CSVReader 
                onUploadAccepted={(results) => {
                    const resultsWithId = results.data.map((row, idx) => ({
                        _id: idx,
                        ...row
                    }));
                    // const cols = Object.values(resultsWithId[0]);
                    // const colsWithId = ["_id", ...cols];
                    // const colsWithIdObj = {}
                    // for (let i = 0; i < colsWithId.length; i ++) {
                    //     colsWithIdObj[i] = colsWithId[i];
                    // };
                    // resultsWithId[0] = colsWithIdObj;
                    setTransactions(resultsWithId)
                }}
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
                    
                        {acceptedFile ? // nested ternary operator on acceptedFile true, else display Upload CSV button
                            previewCSV ? (
                                <>
                                    <EditableGrid gridRef={gridRef} rowData={lowConfTx} colNames={headers} onCellChange={handleCellChange} />
                                    <button onClick={sendData}>Done</button>
                                </>
                            ) : (
                                <div>Loading...</div>
                            ) 
                        : (
                            <div {...getRootProps()}>
                                <button>Upload CSV file</button>
                            </div>
                        )}
                    </>
                )}
            </CSVReader>
        </>
    )
}

export default Upload