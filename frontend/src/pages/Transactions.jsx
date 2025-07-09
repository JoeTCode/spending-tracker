import { NavBar, EditableGrid } from '../components';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';
import { getTransactions } from '../api/transactions';

const formatHeaders = (headers) => {
    const formatted = []
    for (const header in headers) {
        const obj = {}
        if (header === 'Delete Row') {
            obj[field] = header;
            obj[cellRenderer] = props => {
                return <button>Delete?</button>
            };
        }
        else {
            obj[field] = header;
            obj[editable] = true;
            formatted.push(obj);
        }
    }
};

const Transactions = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [ transactions, setTransactions ] = useState([]);
    const [ headers, setHeaders ] = useState([]);

    useEffect(() => {
        const retrieveData = async () => {
            const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            const data = await getTransactions(token, 'd');
            const tx = data.transactions
            const filtered = tx.map(({ date, ...rest }) => ({
                ...rest,
                date: date.split('T')[0]
            }))
            setTransactions(filtered);
            console.log(filtered);
            const hdrs = Object.keys(tx[0]).slice(2);
            setHeaders(hdrs);
            console.log(hdrs);
        };

        retrieveData();
    
    }, []);


    return (
        <>
            <NavBar />
            <h1>Transactions</h1>
            
            {transactions.length > 0 ? (
                <EditableGrid rowInfo={transactions} colNames={
                    headers.map(val => ({
                        field: val,
                        editable: true
                    }))
                } /> ) : null
            }
        </>
    )
}

export default Transactions