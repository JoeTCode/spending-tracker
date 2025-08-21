import NavBar from '../components/NavBar';
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
    const [ clientModel, setClientModel ] = useState(null);

    const formatTransactions = (transactions, setColCount) => {
        const cols = transactions[0];
        console.log(cols);
        const desc_idx = cols.indexOf('Memo');
        const amount_idx = cols.indexOf('Amount');
        const formattedTransactions = transactions.slice(1); // remove cols

        return formattedTransactions.map(tx => {
            const amount = parseFloat(tx[amount_idx]) ? parseFloat(tx[amount_idx]) : 0;
            tx[amount_idx] = amount;
            tx[desc_idx] = formatDescription(tx[desc_idx]);
            return tx;
        })
        .filter(tx => tx[desc_idx] && !isNaN(tx[amount_idx]));
    };

    const getLowConfTransactions = (transactions, predictedCategories, confScores, colCount) => {
        const res = [];
        for (let i = 0; i < transactions.length; i++) {
            if (confScores[i] < MIN_CONF_SCORE) {
                res.push({ ...transactions[i], [colCount]: predictedCategories[i] });
            }
        };

        return res;
    }

    useEffect(() => {
        const categoriseTransactions = async (token) => {
            // if (transactions.length > 0) {
            //     const formattedTransactions = formatTransactions(transactions);

            //     try {
            //         const response = await fetch("http://127.0.0.1:8000/predict", {
            //             method: "POST",
            //             headers: { "Content-Type": "application/json" },
            //             body: JSON.stringify({
            //                 transactions: formattedTransactions
            //             })
            //         });
            //         const res = await response.json();
            //         return res;
            //     } catch (err) {
            //         console.error(err);
            //     };
            // };
            if (transactions.length > 0) {
                const formattedTransactions = formatTransactions(transactions);
                const model = await getClientModel(token);
                const getConfScores = true;
                const transactionsDescriptions = formattedTransactions.map(tx => tx[5])
                console.log('txdesc', transactionsDescriptions);
                const [ predictions, confidenceScores ] = await predict(model, transactionsDescriptions, getConfScores);
                return [predictions, confidenceScores];
            };
        };

        const sendData = async () => {
            if (transactions.length > 0) {
                const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
                const [ predictedCategories, confidenceScores ] = await categoriseTransactions(token);
                
                const colCount = transactions[0].length;
                const lowConfTransactions = getLowConfTransactions(transactions.slice(1), predictedCategories, confidenceScores, colCount);
                console.log(lowConfTransactions);
                // await uploadTransactions(token, transactions, predictedCategories);
            };
        };
        
        sendData();
    }, [transactions]);

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
                        {acceptedFile ? (
                        <>
                            <div></div>
                        </>
                        ) : (
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