import { NavBar, EditableGrid } from '../components';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';
import { getTransactions, deleteTransaction } from '../api/transactions';

const CATEGORIES = ["Groceries", "Housing & Bills", "Finance & Fees", "Transport", "Income", "Shopping", "Eating Out", "Entertainment", "Health & Fitness", "Other / Misc"]

// customise column format and functions for the EditableGrid cols argument
const formatHeaders = (headers, token) => {
    const deleteRowName = 'Delete';
    const headersCopy = [...headers, deleteRowName];
    const formatted = []

    for (const header of headersCopy) {
        const obj = {}
        if (header === 'category') {
            obj['field'] = header
            obj['cellEditor'] = 'agSelectCellEditor'
            obj['cellEditorParams'] = {
                values: CATEGORIES
            }
        }
        if (header === deleteRowName) {
            obj['field'] = header
            obj['width'] = 80
            obj['cellRenderer'] = (props) => {
                const deleteRow = async () => {
                    const deletedRow = props.api.applyTransaction({ remove: [props.data] })
                    await deleteTransaction(token, deletedRow.remove[0].data);
                };

                return (
                    <img
                        src="/circle-xmark-solid.svg"
                        alt="Delete"
                        onClick={deleteRow}
                        style={{
                            cursor: 'pointer',
                            width: '20px',
                            height: '20px',
                            filter: 'grayscale(100%)',
                            opacity: 0.7,
                            marginTop: '10px',
                            marginLeft: '11px'
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'translateY(1px)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.filter = 'none';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.filter = 'none';
                        }}
                    />
                );
            };
            formatted.push(obj);
        }
        else {
            obj['field'] = header;
            obj['editable'] = true;
            formatted.push(obj);
        };
    };

    return formatted;
};

const Transactions = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [ transactions, setTransactions ] = useState([]);
    const [ headers, setHeaders ] = useState([]);

    useEffect(() => {
        const retrieveData = async () => {
            const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            const data = await getTransactions(token, 'a');
            setTransactions(data);
            console.log(Object.keys(data[0]))
            const hdrs = Object.keys(data[0]).slice(2);
            setHeaders(formatHeaders(hdrs, token));
        };

        retrieveData();
    
    }, []);


    return (
        <>
            <NavBar />
            <h1>Transactions</h1>
            
            {transactions.length > 0 ? (
                <EditableGrid rowInfo={transactions} colNames={
                    headers
                } /> ) : null
            }
        </>
    )
}

export default Transactions