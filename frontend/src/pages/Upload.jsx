import { NavBar, EditableGrid } from '../components';
// import { uploadTransactions } from '../api/transactions';
import { useCSVReader } from 'react-papaparse';
import React, { useRef, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { createModel, predict } from '../utils/model';
import { getClientModel, saveClientModel } from '../utils/modelIO';
import { MIN_CONF_SCORE, CATEGORIES } from '../utils/constants/constants';
import { devGetModelWeights } from '../api/globalModel';
import { db, validateTransaction } from '../db/db';
import { pipeline } from '@huggingface/transformers';
import * as tf from '@tensorflow/tfjs';

const CATEGORIES_SET = new Set(CATEGORIES);

// TEMP
const targetCategories = {
  '0': 'Groceries',
  '1': 'Transport',
  '2': 'Housing & Bills',
  '3': 'Groceries',
  '4': 'Entertainment',
  '5': 'Health & Fitness',
  '6': 'Groceries',
  '7': 'Health & Fitness',
  '8': 'Eating Out',
  '9': 'Shopping',
  '10': 'Groceries',
  '11': 'Other / Misc',
  '12': 'Eating Out',
  '13': 'Groceries',
  '14': 'Other / Misc',
  '15': 'Groceries',
  '16': 'Groceries',
  '17': 'Health & Fitness',
  '18': 'Income',
  '19': 'Transport',
  '20': 'Transport',
  '21': 'Health & Fitness',
  '22': 'Eating Out',
  '23': 'Eating Out',
  '24': 'Eating Out',
  '25': 'Transport',
  '26': 'Health & Fitness',
  '27': 'Health & Fitness',
  '28': 'Eating Out',
  '29': 'Transport',
  '30': 'Groceries',
  '31': 'Health & Fitness',
  '32': 'Groceries',
  '33': 'Groceries',
  '34': 'Health & Fitness',
  '35': 'Health & Fitness',
  '36': 'Health & Fitness',
  '37': 'Groceries',
  '38': 'Groceries',
  '39': 'Health & Fitness',
  '40': 'Housing & Bills',
  '41': 'Health & Fitness',
  '42': 'Transport',
  '43': 'Other / Misc',
  '44': 'Eating Out',
  '45': 'Shopping',
  '46': 'Income',
  '47': 'Health & Fitness',
  '48': 'Entertainment',
  '49': 'Eating Out',
  '50': 'Transport',
  '51': 'Groceries',
  '52': 'Eating Out',
  '53': 'Other / Misc',
  '54': 'Income',
  '55': 'Eating Out',
  '56': 'Health & Fitness',
  '57': 'Health & Fitness',
  '58': 'Other / Misc',
  '59': 'Health & Fitness',
  '60': 'Eating Out',
  '61': 'Other / Misc',
  '62': 'Other / Misc',
  '63': 'Health & Fitness',
  '64': 'Groceries',
  '65': 'Health & Fitness',
  '66': 'Health & Fitness',
  '67': 'Income',
  '68': 'Other / Misc',
  '69': 'Eating Out',
  '70': 'Other / Misc',
  '71': 'Eating Out',
  '72': 'Other / Misc',
  '73': 'Health & Fitness',
  '74': 'Other / Misc',
  '75': 'Shopping',
  '76': 'Eating Out',
  '77': 'Shopping',
  '78': 'Shopping',
  '79': 'Shopping',
  '80': 'Other / Misc',
  '81': 'Other / Misc',
  '82': 'Transport',
  '83': 'Health & Fitness',
  '84': 'Income',
  '85': 'Groceries',
  '86': 'Eating Out',
  '87': 'Health & Fitness',
  '88': 'Groceries',
  '89': 'Shopping',
  '90': 'Eating Out',
  '91': 'Health & Fitness',
  '92': 'Health & Fitness',
  '93': 'Transport',
  '94': 'Housing & Bills',
  '95': 'Groceries',
  '96': 'Eating Out',
  '97': 'Groceries',
  '98': 'Health & Fitness',
  '99': 'Other / Misc',
  '100': 'Health & Fitness',
  '101': 'Groceries',
  '102': 'Eating Out',
  '103': 'Transport',
  '104': 'Other / Misc',
  '105': 'Other / Misc',
  '106': 'Eating Out',
  '107': 'Eating Out',
  '108': 'Groceries',
  '109': 'Other / Misc',
  '110': 'Eating Out',
  '111': 'Eating Out',
  '112': 'Groceries',
  '113': 'Transport',
  '114': 'Eating Out',
  '115': 'Eating Out',
  '116': 'Health & Fitness',
  '117': 'Eating Out',
  '118': 'Health & Fitness',
  '119': 'Income',
  '120': 'Eating Out',
  '121': 'Eating Out',
  '122': 'Income',
  '123': 'Eating Out',
  '124': 'Shopping',
  '125': 'Groceries',
  '126': 'Income',
  '127': 'Income',
  '128': 'Other / Misc',
  '129': 'Health & Fitness',
  '130': 'Shopping',
  '131': 'Groceries',
  '132': 'Eating Out',
  '133': 'Other / Misc',
  '134': 'Health & Fitness',
  '135': 'Groceries',
  '136': 'Eating Out',
  '137': 'Housing & Bills',
  '138': 'Other / Misc',
  '139': 'Income',
  '140': 'Health & Fitness',
  '141': 'Health & Fitness',
  '142': 'Health & Fitness',
  '143': 'Eating Out',
  '144': 'Shopping',
  '145': 'Eating Out',
  '146': 'Groceries',
  '147': 'Health & Fitness',
  '148': 'Income',
  '149': 'Income',
  '150': 'Income',
  '151': 'Eating Out',
  '152': 'Transport',
  '153': 'Groceries',
  '154': 'Groceries',
  '155': 'Other / Misc',
  '156': 'Transport',
  '157': 'Eating Out',
  '158': 'Eating Out',
  '159': 'Eating Out',
  '160': 'Housing & Bills',
  '161': 'Health & Fitness',
  '162': 'Health & Fitness',
  '163': 'Health & Fitness',
  '164': 'Eating Out',
  '165': 'Eating Out',
  '166': 'Other / Misc',
  '167': 'Transport',
  '168': 'Groceries',
  '169': 'Groceries',
  '170': 'Eating Out',
  '171': 'Health & Fitness',
  '172': 'Health & Fitness',
  '173': 'Eating Out',
  '174': 'Transport',
  '175': 'Eating Out',
  '176': 'Eating Out',
  '177': 'Groceries',
  '178': 'Eating Out',
  '179': 'Other / Misc',
  '180': 'Eating Out',
  '181': 'Income',
  '182': 'Eating Out',
  '183': 'Eating Out',
  '184': 'Health & Fitness',
  '185': 'Transport',
  '186': 'Health & Fitness',
  '187': 'Transport',
  '188': 'Transport',
  '189': 'Groceries',
  '190': 'Eating Out',
  '191': 'Eating Out',
  '192': 'Transport',
  '193': 'Eating Out',
  '194': 'Eating Out',
  '195': 'Health & Fitness',
  '196': 'Groceries',
  '197': 'Housing & Bills',
  '198': 'Transport',
  '199': 'Eating Out',
  '200': 'Groceries',
  '201': 'Other / Misc',
  '202': 'Transport',
  '203': 'Health & Fitness',
  '204': 'Groceries',
  '205': 'Shopping',
  '206': 'Transport',
  '207': 'Eating Out',
  '208': 'Groceries',
  '209': 'Groceries',
  '210': 'Health & Fitness',
  '211': 'Shopping',
  '212': 'Transport',
  '213': 'Eating Out',
  '214': 'Transport',
  '215': 'Eating Out',
  '216': 'Transport',
  '217': 'Groceries',
  '218': 'Health & Fitness',
  '219': 'Groceries',
  '220': 'Groceries',
  '221': 'Transport',
  '222': 'Health & Fitness',
  '223': 'Eating Out',
  '224': 'Eating Out',
  '225': 'Eating Out',
  '226': 'Transport',
  '227': 'Transport',
  '228': 'Groceries',
  '229': 'Health & Fitness',
  '230': 'Income',
  '231': 'Eating Out',
  '232': 'Eating Out',
  '233': 'Transport',
  '234': 'Eating Out',
  '235': 'Groceries',
  '236': 'Eating Out',
  '237': 'Housing & Bills',
  '238': 'Groceries',
  '239': 'Transport',
  '240': 'Shopping',
  '241': 'Groceries',
  '242': 'Eating Out',
  '243': 'Finance & Fees',
  '244': 'Groceries',
  '245': 'Health & Fitness',
  '246': 'Income',
  '247': 'Health & Fitness',
  '248': 'Income',
  '249': 'Housing & Bills',
  '250': 'Finance & Fees',
  '251': 'Housing & Bills',
  '252': 'Housing & Bills',
  '253': 'Eating Out',
  '254': 'Eating Out',
  '255': 'Finance & Fees',
  '256': 'Eating Out',
  '257': 'Eating Out',
  '258': 'Transport',
  '259': 'Transport',
  '260': 'Eating Out',
  '261': 'Groceries',
  '262': 'Transport',
  '263': 'Transport',
  '264': 'Transport',
  '265': 'Eating Out',
  '266': 'Transport',
  '267': 'Transport',
  '268': 'Transport',
  '269': 'Health & Fitness',
  '270': 'Income',
  '271': 'Housing & Bills',
  '272': 'Eating Out',
  '273': 'Groceries',
  '274': 'Finance & Fees',
  '275': 'Groceries',
  '276': 'Transport',
  '277': 'Other / Misc',
  '278': 'Groceries',
  '279': 'Finance & Fees',
  '280': 'Finance & Fees',
  '281': 'Groceries',
  '282': 'Housing & Bills',
  '283': 'Groceries',
  '284': 'Other / Misc',
  '285': 'Eating Out',
  '286': 'Eating Out',
  '287': 'Transport',
  '288': 'Housing & Bills',
  '289': 'Transport',
  '290': 'Eating Out',
  '291': 'Finance & Fees',
  '292': 'Eating Out',
  '293': 'Other / Misc',
  '294': 'Eating Out',
  '295': 'Eating Out',
  '296': 'Other / Misc',
  '297': 'Groceries',
  '298': 'Transport',
  '299': 'Finance & Fees',
  '300': 'Groceries',
  '301': 'Groceries',
  '302': 'Entertainment',
  '303': 'Entertainment',
  '304': 'Transport',
  '305': 'Health & Fitness',
  '306': 'Groceries',
  '307': 'Transport',
  '308': 'Groceries',
  '309': 'Groceries',
  '310': 'Transport',
  '311': 'Groceries',
  '312': 'Transport',
  '313': 'Groceries',
  '314': 'Housing & Bills',
  '315': 'Transport',
  '316': 'Eating Out',
  '317': 'Transport',
  '318': 'Groceries',
  '319': 'Transport',
  '320': 'Groceries',
  '321': 'Transport',
  '322': 'Shopping',
  '323': 'Other / Misc',
  '324': 'Other / Misc',
  '325': 'Other / Misc',
  '326': 'Eating Out',
  '327': 'Other / Misc',
  '328': 'Other / Misc',
  '329': 'Transport',
  '330': 'Other / Misc',
  '331': 'Health & Fitness',
  '332': 'Groceries',
  '333': 'Housing & Bills',
  '334': 'Finance & Fees',
  '335': 'Eating Out',
  '336': 'Eating Out',
  '337': 'Eating Out',
  '338': 'Housing & Bills',
  '339': 'Eating Out',
  '340': 'Transport',
  '341': 'Transport',
  '342': 'Health & Fitness',
  '343': 'Shopping',
  '344': 'Groceries',
  '345': 'Health & Fitness',
  '346': 'Eating Out',
  '347': 'Transport',
  '348': 'Health & Fitness',
  '349': 'Health & Fitness',
  '350': 'Eating Out',
  '351': 'Groceries',
  '352': 'Transport',
  '353': 'Transport',
  '354': 'Shopping',
  '355': 'Shopping',
  '356': 'Transport',
  '357': 'Eating Out',
  '358': 'Eating Out',
  '359': 'Groceries',
  '360': 'Other / Misc',
  '361': 'Eating Out',
  '362': 'Other / Misc',
  '363': 'Income',
  '364': 'Transport',
  '365': 'Entertainment',
  '366': 'Groceries',
  '367': 'Eating Out',
  '368': 'Other / Misc',
  '369': 'Finance & Fees',
  '370': 'Other / Misc',
  '371': 'Transport',
  '372': 'Other / Misc',
  '373': 'Other / Misc',
  '374': 'Transport',
  '375': 'Transport',
  '376': 'Eating Out',
  '377': 'Eating Out',
  '378': 'Eating Out',
  '379': 'Groceries',
  '380': 'Shopping',
  '381': 'Transport',
  '382': 'Groceries',
  '383': 'Groceries',
  '384': 'Groceries',
  '385': 'Health & Fitness',
  '386': 'Eating Out',
  '387': 'Entertainment',
  '388': 'Entertainment',
  '389': 'Groceries',
  '390': 'Transport',
  '391': 'Finance & Fees',
  '392': 'Eating Out',
  '393': 'Other / Misc',
  '394': 'Other / Misc',
  '395': 'Groceries',
  '396': 'Shopping',
  '397': 'Entertainment',
  '398': 'Entertainment',
  '399': 'Health & Fitness',
  '400': 'Eating Out',
  '401': 'Other / Misc',
  '402': 'Shopping',
  '403': 'Shopping',
  '404': 'Entertainment',
  '405': 'Finance & Fees',
  '406': 'Entertainment',
  '407': 'Housing & Bills',
  '408': 'Entertainment',
  '409': 'Health & Fitness'
}

function formatDescription(desc) {
    let formattedDesc = String(desc).split('\t')[0].trim();
    formattedDesc = formattedDesc.replace(/\s+/g, ' ').trim();
    return formattedDesc;
};

function formatDate(date) {
    // input format (String) DD/MM/YYYY
    // convert to ISO YYYY-MM-DD
    const [ day, month, year ] = date.split("/");
    return `${year}-${month}-${day}`;
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
    const [duplicateWarning, setDuplicateWarning] = useState(false);
    const [duplicateRows, setDuplicateRows] = useState([]);
    const [ fileParsed, setFileParsed ] = useState(false);

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

    const getLowConfTransactions = (transactions, predictedCategories, confScores) => {
        const res = [];
        for (let i = 0; i < transactions.length; i++) {
            if (confScores[i] < MIN_CONF_SCORE) {
                res.push({ ...transactions[i], 'category': predictedCategories[i], 'confidence': Math.round(confScores[i] * 100) });
            };
        };

        return res;
    }

    async function categoriseTransactions(formattedTransactions, batchSize = 32) {
        const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
        const predictions = [];
        const confidenceScores = [];
        if (transactions.length > 0) {
            const model = await getClientModel(token);
            // Create a feature-extraction pipeline
            const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

            const transactionsDescriptions = formattedTransactions.map(tx => tx['description'])
            
            for (let i = 0; i < transactionsDescriptions.length; i += batchSize) {
                const batch = transactionsDescriptions.slice(i, i + batchSize);
                // Compute sentence embeddings
                // const embeddingsArray = await extractor(batch, { pooling: 'mean', normalize: true });
                // Convert flat array to tensor
                // const embeddings = tf.tensor2d(embeddingsArray.ort_tensor.cpuData, embeddingsArray.ort_tensor.dims, tf.float32);
                const getConfScores = true;

                const [ preds, confScores ] = await predict(model, extractor, batch, getConfScores);
                predictions.push(preds);
                confidenceScores.push(confScores);

                // Yield back to the browser
                await new Promise(r => setTimeout(r, 0));
            };
            
            return [predictions.flat(), confidenceScores.flat()];
        };
    };

    useEffect(() => {
        
        // async function categoriseTransactions(formattedTransactions, batchSize = 32) {
        //     const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            
        //     if (transactions.length > 0) {
        //         const model = await getClientModel(token);
        //         const transactionsDescriptions = formattedTransactions.map(tx => tx['description'])

        //         const getConfScores = true;
        //         const [ predictions, confidenceScores ] = await predict(model, transactionsDescriptions, getConfScores);
        //         return [predictions, confidenceScores];
        //     };
        // };


        const createCSVPreview = async () => {
            if (transactions.length > 0) {
                const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
                
                // const formattedTransactions = formatBarclaysTransactions(transactions, ["date", "account", "amount", "subcategory", "memo" ], "amount", "memo");

                const validatedTransactions = transactions.map((tx, i) => validateTransaction(tx, i));
                const timer = new Date().getTime();
                const [ predictedCategories, confidenceScores ] = await categoriseTransactions(validatedTransactions);                
                console.log((new Date().getTime() - timer) / 1000);
                // TEMP
                let numMatches = 0;
                const targets = Object.values(targetCategories);
                for (let i = 0; i < predictedCategories.length; i++) {
                    if (predictedCategories[i] === targets[i]) {
                        numMatches += 1;
                    }
                }

                console.log('Score:', (numMatches*100)/predictedCategories.length);

                const lowConfTransactions = getLowConfTransactions(validatedTransactions, predictedCategories, confidenceScores);
                const headers = Object.keys(lowConfTransactions[0]);
                const reordered = ["confidence", "category", ...headers.filter(col => col !== "category" && col !== "confidence")];
                setLowConfTx(lowConfTransactions);
                
                setHeaders(() => {
                    const formatted = [];
                    
                    for (let header of reordered) {
                        const obj = {};
                        if (header === '_id') {
                            continue;
                        }
                        if (header === 'confidence') {
                            obj['field'] = header;
                            obj['editable'] = true;
                            obj['width'] = 120
                            obj['valueFormatter'] = params => {
                                if (params.value == null) return '';
                                return `${params.value}%`;
                            };
                        };
                        if (header === 'date') {
                            obj['field'] = header;
                            obj['editable'] = true;
                            obj['width'] = 120
                        }
                        if (header === 'amount') {
                            obj['field'] = header;
                            obj['editable'] = true;
                            obj['width'] = 120
                        }
                        else if (header === 'category') {
                            obj['field'] = header;
                            obj['editable'] = true;
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

                for (let i = 0; i < validatedTransactions.length; i ++) {
                    validatedTransactions[i]['category'] = predictedCategories[i];
                };
                console.log(validatedTransactions);
                
                const dates = validatedTransactions.map(tx => new Date(tx['date']));
                dates.sort((a, b) => a.getTime() - b.getTime());
                const start = dates[0];
                const end = dates[dates.length - 1];

                const transactionsInRange = await db.barclaysTransactions
                    .where('date')
                    .between(start, end, true, true) // true=true includes bounds
                    .toArray();

                if (transactionsInRange.length > 0) {
                    console.warn('WARNING: Existing transactions found in uploaded CSV date range:', transactionsInRange);
                    setDuplicateWarning(true);
                    setDuplicateRows(transactionsInRange);
                    // Reset to file upload step
                    setPreviewCSV(false);        // hide editable grid
                } else {
                    await db.barclaysTransactions.bulkAdd(validatedTransactions);
                    console.log('Transactions uploaded successfully');
                    setSaveData(validatedTransactions);
                    setPreviewCSV(true);
                };
            };
        };

        createCSVPreview();
    }, [transactions]);


    const sendData = async () => {
        // const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
        // await uploadTransactions(token, saveData);

    };


    const handleCellChange = (updatedRow, params) => {
        setLowConfTx(prev =>
            prev.map(row => row._id === updatedRow._id ? updatedRow : row)
        );

        const column = params.column.colId;
        if (column === 'category') {
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
                    const formatted = results.data.map(tx => {
                        const amount = parseFloat(tx['Amount']) ? parseFloat(tx['Amount']) : 0;
                        return {
                            'account': tx['Account'],
                            'amount': amount,
                            'date': formatDate(tx['Date']),
                            'description': formatDescription(tx['Memo']),
                            'type': tx['Subcategory']                        
                        };
                    })
                    .filter(tx => tx['description'] && tx['description'] !== "undefined" && !isNaN(tx['amount']));
                    
                    console.log(formatted);
                    setTransactions(formatted);
                    setFileParsed(true);
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
                        {duplicateWarning ? (
                            <div>
                                <p>Duplicate transactions found in your CSV:</p>
                                <ul>
                                    {duplicateRows.map((tx, i) => (
                                        <li key={i}>{tx.date.toLocaleDateString()} — {tx.description} — {tx.amount}</li>
                                    ))}
                                </ul>
                                <button 
                                    {...getRemoveFileProps()}
                                    onClick={() => {
                                        setDuplicateWarning(false);
                                        setFileParsed(false);
                                        setDuplicateRows([]);
                                    }}
                                >
                                    Go back to Upload CSV
                                </button>
                            </div>
                        ) : fileParsed ? (
                            previewCSV ? (
                                <>
                                    <EditableGrid gridRef={gridRef} rowData={lowConfTx} colNames={headers} onCellChange={handleCellChange} />
                                    <button onClick={sendData}>Done</button>
                                </>
                            ) : (
                                <div>Loading...</div>
                            )
                        ) : (
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