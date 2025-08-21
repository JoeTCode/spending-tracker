import { NavBar, EditableGrid } from '../components';
import { uploadTransactions } from '../api/transactions';
import { useCSVReader } from 'react-papaparse';
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { createModel, predict } from '../utils/model';
import { getClientModel, saveClientModel } from '../utils/modelIO';
import { MIN_CONF_SCORE } from '../utils/constants/constants';
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
    const [ cols, setCols ] = useState([]);
    const [ headers, setHeaders ] = useState(null);

    const formatTransactions = (transactions, cols) => {
        const propertyToDelete = cols.indexOf('Number');
        const desc_idx = cols.indexOf('Memo');
        const amount_idx = cols.indexOf('Amount');
        const formattedTransactions = transactions.slice(1); // remove cols

        return formattedTransactions.map(tx => {
            delete tx[propertyToDelete];
            const amount = parseFloat(tx[amount_idx]) ? parseFloat(tx[amount_idx]) : 0;
            tx[amount_idx] = amount;
            tx[desc_idx] = formatDescription(tx[desc_idx]);
            return {
                [cols[1]]: tx[1],
                [cols[2]]: tx[2],
                [cols[3]]: tx[3],
                [cols[4]]: tx[4],
                [cols[5]]: tx[5],
            }
        })
        .filter(tx => tx['Memo'] && !isNaN(tx['Amount']));
    };

    const getLowConfTransactions = (transactions, predictedCategories, confScores, colCount) => {
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

                console.log('txdesc', transactionsDescriptions);

                const getConfScores = true;
                const [ predictions, confidenceScores ] = await predict(model, transactionsDescriptions, getConfScores);
                return [predictions, confidenceScores];
            };
        };

        const createCSVPreview = async () => {
            if (transactions.length > 0) {
                const CSV_COLUMNS = transactions[0];
                console.log(CSV_COLUMNS)
                setCols(CSV_COLUMNS);
                const CSV_COLUMNS_COUNT = CSV_COLUMNS.length;
                console.log(CSV_COLUMNS);
                const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
                
                const formattedTransactions = formatTransactions(transactions, CSV_COLUMNS);
                console.log('formatted', formattedTransactions);
                const [ predictedCategories, confidenceScores ] = await categoriseTransactions(token, formattedTransactions);                
                
                const lowConfTransactions = getLowConfTransactions(formattedTransactions, predictedCategories, confidenceScores, CSV_COLUMNS_COUNT);
                console.log(lowConfTransactions);
                const headers = Object.keys(lowConfTransactions[0]);
                console.log(headers)
                setLowConfTx(lowConfTransactions);
                
                setHeaders(() => {
                    const formatted = [];

                    for (let header of headers) {
                        const obj = {};
                        obj['field'] = header;
                        obj['editable'] = true;
                        formatted.push(obj);
                    }
                    return formatted;
                });

                setPreviewCSV(true);
                
            };
        };

        createCSVPreview();
    }, [transactions]);

    useEffect(() => {
        const sendData = async () => {
            // await uploadTransactions(token, transactions, predictedCategories);
        }
        
        sendData();
    }, [])

    return (
        <>
            <NavBar />
            <h1>Upload</h1>
            <CSVReader 
                onUploadAccepted={(results) => {
                    setTransactions(results.data)
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
                    <div {...getRootProps()}>
                        {acceptedFile ? // nested ternary operator on acceptedFile true, else display Upload CSV button
                            previewCSV ? (
                                <>
                                    <EditableGrid rowInfo={lowConfTx} colNames={headers} />
                                </>
                            ) : (
                                <div>Loading...</div>
                            ) 
                        : (
                            <button>Upload CSV file</button>
                        )}
                    </div>
                    </>
                )}
            </CSVReader>
        </>
    )
}

export default Upload