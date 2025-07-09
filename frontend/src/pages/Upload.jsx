import NavBar from '../components/NavBar';
import { uploadTransactions } from '../api/transactions';
import { useCSVReader } from 'react-papaparse';
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const Upload = () => {
    const { CSVReader } = useCSVReader();
    const [ transactions, setTransactions ] = useState([]);
    const { getAccessTokenSilently } = useAuth0();
    
    useEffect(() => {
        const sendData = async () => {
            if (transactions.length > 0) {
                const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
                await uploadTransactions(token, transactions);
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
                
            {/* {transactions.length ? 
            <table>
                <thead>
                    <tr>
                        {transactions[0].map((val, i) => {
                            return <th key={i}>{val}</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                    {transactions.slice(1).map((row, i) => {
                        return (
                            <tr key={i}>
                                {row.map((value, j) => {
                                    return <td key={j}>{value}</td>
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            : null} */}
            

        </>
    )
}

export default Upload