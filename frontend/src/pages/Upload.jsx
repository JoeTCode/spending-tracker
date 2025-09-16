import { NavBar, EditableGrid } from '../components';
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
import Switch from '../components/Switch';
import Warning from '../assets/icons/warning-circle-svgrepo-com.svg?react';
import Tick from '../assets/icons/tick-hollow-circle-svgrepo-com.svg?react';
import CustomProgressBar from '../components/ProgressBar';

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
    const dateString = `${year}-${month}-${day}`;
    return new Date(dateString);

}

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

const UploadCSV = ({ allowCategorisation, setAllowCategorisation, getRootProps }) => (
    <div>
        <div className='flex bg-[#1a1818] w-full p-10 rounded-lg mb-5 justify-between'>
            <div>
                <p className='text-white'>Auto-Categorisation</p>
                <p className='text-neutral-400 text-sm'>Automatically categorise transactions based on description content</p>
            </div>
            <Switch enabled={allowCategorisation} setEnabled={setAllowCategorisation} />
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
}

const Upload = () => {
    const { CSVReader } = useCSVReader();
    const [ transactions, setTransactions ] = useState([]); // list of dicts
    const { getAccessTokenSilently } = useAuth0();
    const [ previewCSV, setPreviewCSV ] = useState(false);
    const [ lowConfTx, setLowConfTx ] = useState([]);
    const [ saveData, setSaveData ] = useState([]);
    const [ allowCategorisation, setAllowCategorisation ] = useState(true);
    const [ duplicateWarning, setDuplicateWarning ] = useState(false);
    const [ duplicateRows, setDuplicateRows ] = useState([]);
    const [ absoluteDuplicateRows, setAbsoluteDuplicateRows ] = useState([]); 

    const [ fileParsed, setFileParsed ] = useState(false);
    const [ mapColumns, setMapColumns ] = useState(false);
    const [ parsedCSV, setParsedCSV ] = useState([]);
    const [ columnNames, setColumnNames ] = useState([]);

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

    const navigate = useNavigate();


    const getLowConfTransactions = (transactions, predictedCategories, confScores) => {
        const res = [];
        for (let i = 0; i < transactions.length; i++) {
            if (confScores[i] < MIN_CONF_SCORE) {
                res.push({ ...transactions[i], 'category': predictedCategories[i], 'confidence': Math.round(confScores[i] * 100) });
            };
        };

        return res;
    };

    async function categoriseTransactions(formattedTransactions, batchSize = 32) {
        const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
        const predictions = [];
        const confidenceScores = [];
        
        if (transactions.length > 0) {
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

            console.log((new Date().getTime() - timer) / 1000);
            
            return [predictions.flat(), confidenceScores.flat()];
        };
    };

    
    useEffect(() => {
        const handleTransactions = async () => {
            if (mapColumns && transactions.length > 0) {
                const validatedTransactions = transactions.map((tx, i) => validateTransaction(tx, i));
                
                if (allowCategorisation) {
                    const [ predictedCategories, confidenceScores ] = await categoriseTransactions(validatedTransactions);                
                    
                    // TEMP
                    logModelAccuracy(targetCategories, predictedCategories);

                    const lowConfTransactions = getLowConfTransactions(validatedTransactions, predictedCategories, confidenceScores);
                    // const lowConfTransactionsWithStatusCol = lowConfTransactions.map(tx => ({ ...tx, status: 'unreviewed' }));
                    setLowConfTx(lowConfTransactions);

                    for (let i = 0; i < validatedTransactions.length; i ++) {
                        validatedTransactions[i]['category'] = predictedCategories[i];
                    };
                };
                
                const timestamps = validatedTransactions.map(tx => new Date(tx.date).getTime());
                const minTime = Math.min(...timestamps);
                const maxTime = Math.max(...timestamps);
                const start = new Date(minTime);
                const end = new Date(maxTime);

                const transactionsInRange = await db.barclaysTransactions
                    .where('date')
                    .between(start, end, true, true) // true=true includes bounds
                    .toArray();
                
                console.log(validatedTransactions);
                if (transactionsInRange.length > 0) {
                    const getAbsoluteDuplicates = (transactionsInRange, validatedTransactions) => {
                        // create a Set of db _id's
                        const dbIdSet = new Set(transactionsInRange.map(tx => tx._id));
                        // const duplicates = validatedTransactions.filter(
                        //     tx => dbIdSet.has(makeTransactionId({ account: tx.account, date: tx.date, amount: tx.amount, description: tx.description, type: tx.type }))
                        // );
                        const duplicates = [];
                        for (let i = 0; i < validatedTransactions.length; i++) {
                            const tx = validatedTransactions[i];
                            if (dbIdSet.has(makeTransactionId({ row: i, account: tx.account, date: tx.date, amount: tx.amount, description: tx.description, type: tx.type }))) {
                                duplicates.push(tx);
                            };
                        };
                        return duplicates;
                    };
                    const findDuplicates = (transactionsInRange, validatedTransactions) => {
                        // create a Set of DB field hashes from the users new transactions, without row number
                        const dbFieldHashes = new Set(transactionsInRange.map(tx => makeTransactionId({ account: tx.account, date: tx.date, amount: tx.amount, description: tx.description, type: tx.type })));

                        // filter uploaded transactions in one pass
                        const duplicates = validatedTransactions.filter(
                            tx => dbFieldHashes.has(makeTransactionId({ account: tx.account, date: tx.date, amount: tx.amount, description: tx.description, type: tx.type }))
                        );

                        return duplicates;
                    };
                    
                    const absDuplicates = getAbsoluteDuplicates(transactionsInRange, validatedTransactions);
                    const absoluteDuplicatesIdSet = new Set(absDuplicates.map(tx => tx._id));
                    const filteredTransactions = transactionsInRange.filter(tx => !absoluteDuplicatesIdSet.has(tx._id)); 
                    const duplicates = findDuplicates(filteredTransactions, validatedTransactions);

                    if (absDuplicates.length > 0 || duplicates.length > 0) {
                        const duplicatesIdSet= new Set(duplicates.map(tx => tx._id));
                        const transactionsWithoutDuplicates = validatedTransactions.filter(tx => !duplicatesIdSet.has(tx._id));
                        console.log('absolute Duplicates', absDuplicates);
                        console.log('Duplicates', duplicates);
                        setDuplicateWarning(true);
                        setAbsoluteDuplicateRows(absDuplicates)
                        setDuplicateRows(duplicates); // set duplicates 
                        setSaveData(transactionsWithoutDuplicates) // set all transactions (without duplicates)
                        setPreviewCSV(false); // hide editable grid
                    } 
                    
                    else {
                        console.log('validated transactions', validatedTransactions);
                        if (allowCategorisation) {
                            setSaveData(validatedTransactions);
                            setPreviewCSV(true);
                            setFileParsed(true);
                        } else {
                            await db.barclaysTransactions.bulkAdd(validatedTransactions);
                            navigate('/dashboard');
                        }
                    };

                } 
            };
        };

        handleTransactions();
    }, [mapColumns]);

    const renderContent = (getRootProps, getRemoveFileProps) => {
        if (mapColumns) {
            return (
                <MapColumns
                    parsedCSV={parsedCSV}
                    setParsedCSV={setParsedCSV}
                    setFileParsed={setFileParsed}
                    setMapColumns={setMapColumns}
                    setColumnNames={setColumnNames}
                    allowCategorisation={allowCategorisation}
                />
            );
        };
        if (duplicateWarning) {
            return (
                <ReviewDuplicates 
                    nonDuplicateRows={saveData}
                    absoluteDuplicateRows={absoluteDuplicateRows}
                    duplicateRows={duplicateRows}
                    setDuplicateRows={setDuplicateRows}
                    setDuplicateWarning={setDuplicateWarning}
                    setFileParsed={setFileParsed}
                    setPreviewCSV={setPreviewCSV}
                    getRemoveFileProps={getRemoveFileProps}
                    setSaveData={setSaveData}
                    setLowConfTx={setLowConfTx}
                />
            );
        };

        if (fileParsed) {
            return previewCSV 
                ? <PreviewCSV saveData={saveData} lowConfTx={lowConfTx} setFileParsed={setFileParsed} setPreviewCSV={setPreviewCSV} />
                : <div>Loading...</div>;
        };

        return (
            <UploadCSV
                allowCategorisation={allowCategorisation}
                setAllowCategorisation={setAllowCategorisation}
                getRootProps={getRootProps}
            />
        );
    };

        

    return (
        <>
            <NavBar />
            
            <div className='flex justify-center mt-[20%] '>
                <CSVReader 
                    onUploadAccepted={(results) => {
                        const cleaned = removeErrorRows(results);
                        // const formatted = formatBarclaysCSV(results, allowCategorisation);
                        // setTransactions(formatted);
                        setParsedCSV(cleaned);
                        setFileParsed(true);
                        setMapColumns(true);
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