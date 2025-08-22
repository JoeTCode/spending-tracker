import { NavBar, EditableGrid } from '../components';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useRef, useState, useEffect } from 'react';
import { getTransactions, deleteTransaction } from '../api/transactions';


// TEST - UNCOMMENT IMPORT UPON DELTING THIS
async function updateTransactions(val1, val2) {
    
};


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

    const [ rowData, setRowData ] = useState(null);
    const [ undos, setUndos ] = useState([]);
    const [ redos, setRedos ] = useState([]);
    const gridRef = useRef(null);
    const [ token, setToken ] = useState(null)

    useEffect(() => {
        const getToken = async () => {
            const tokenValue = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            return setToken(tokenValue);
        };
        getToken();
        
    }, []);
    
    useEffect(() => {
        const retrieveData = async () => {
            const data = await getTransactions(token, 'a');

            setTransactions(data);

            setRowData(data); // new

            console.log(Object.keys(data[0]))
            const hdrs = Object.keys(data[0]).slice(2);
            setHeaders(formatHeaders(hdrs, token));
        };

        retrieveData();
    
    }, [token]);


    async function undo() {
        const undosPopped = [...undos];
        const mostRecentUndo = undosPopped.pop()

        // add row state before undo to redo
        for (const row of rowData) {
            if (row._id === mostRecentUndo._id) {
                setRedos(prev => {
                    if (prev.length > 0) {
                        return [...prev, row];
                    } else return [row];
                });
            };
        }; 

        gridRef.current.api.applyTransaction({
            update: [mostRecentUndo]
        });

        await updateTransactions(token, mostRecentUndo);

        setRowData(prevRows => {
            return prevRows.map(row => row._id === mostRecentUndo._id ? mostRecentUndo : row);
        });
        setUndos(undosPopped);
    };

    async function redo() {
        const redosPopped = [...redos];
        const mostRecentRedo = redosPopped.pop();

        // add row state before redo to undo
        for (const row of rowData) {
            if (row._id === mostRecentRedo._id) {
                setUndos(prev => {
                    if (prev.length > 0) {
                        return [...prev, row];
                    } else return [row];
                });
            };
        };

        gridRef.current.api.applyTransaction({
            update: [mostRecentRedo]
        });
        
        await updateTransactions(token, mostRecentRedo);

        setRowData(prevRows => {
            return prevRows.map(row => row._id === mostRecentRedo._id ? mostRecentRedo : row);
        });
        setRedos(redosPopped);
    };


    const handleCellChange = (updatedRow, params) => {
        // // apply update to parent state
        // setRowData(prev =>
        //     prev.map(row => row._id === updatedRow._id ? updatedRow : row)
        // );
        // optionally: save to API here
        
        // console.log(updatedRow);
        // console.log("Cell changed:", params.colDef.field, params.oldValue, "→", params.newValue);
        
        setRedos([]);
        try {
            // await updateTransactions(token, updatedRow);
            const column = params.column.colId;
            
            setUndos((prev) => {
                if (prev) {
                    return [...prev, {...updatedRow, [column]: params.oldValue}]
                } else {
                    return [{...updatedRow, [column]: params.oldValue}]
                };
            });
        } catch (err) {
            console.error(err);
        };
    };

    return (
        <>
            <NavBar />
            <h1>Transactions</h1>
            
            {rowData && rowData.length > 0 ? (
                <EditableGrid gridRef={gridRef} rowData={rowData} colNames={headers} onCellChange={handleCellChange} /> ) : null
            }

            {undos.length > 0 ? (
                <button onClick={async () => { await undo() }}> Undo </button> )  
                : ( <button disabled className='disabled-button'> Undo </button> )
            }

            {redos.length > 0 ? (
                <button onClick={async () => { await redo() }}> Redo </button>
            ) : ( <button disabled className='disabled-button'> Redo </button> )}

            {/* User can manually train corrected/added transactions, this will set a trained flag to true for each
            row in thwe grid that is trained, this will NOT execute model averaging with the global model. */}
            <button>Train</button>
        </>
    )
}

export default Transactions