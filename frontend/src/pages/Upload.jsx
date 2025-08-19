import NavBar from '../components/NavBar';
import { uploadTransactions } from '../api/transactions';
import { useCSVReader } from 'react-papaparse';
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const formatTransactions = (transactions) => {
    const cols = transactions[0];
    const desc_idx = cols.indexOf('Memo');
    const amount_idx = cols.indexOf('Amount');
    transactions = transactions.slice(1);

    return transactions.map(tx => {
        const amount = parseFloat(tx[amount_idx]) ? parseFloat(tx[amount_idx]) : 0;
        return {
            description: tx[desc_idx],
            amount: amount
        };
    })
    .filter(tx => tx.description && !isNaN(tx.amount));
};

const Upload = () => {
    const { CSVReader } = useCSVReader();
    const [ transactions, setTransactions ] = useState([]);
    const { getAccessTokenSilently } = useAuth0();
    
    useEffect(() => {
        const categoriseTransactions = async () => {
            if (transactions.length > 0) {
                const formattedTransactions = formatTransactions(transactions);

                try {
                    const response = await fetch("http://127.0.0.1:8000/predict", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            transactions: formattedTransactions
                        })
                    });
                    const res = await response.json();
                    return res;
                } catch (err) {
                    console.error(err);
                };
            };
        };

        const sendData = async () => {
            if (transactions.length > 0) {
                const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
                const predictedCategories = await categoriseTransactions();
                await uploadTransactions(token, transactions, predictedCategories);
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