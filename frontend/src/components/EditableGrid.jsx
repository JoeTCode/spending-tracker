import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import React, { useRef, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { updateTransactions } from '../api/transactions';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const EditableGrid = ({ rowInfo, colNames }) => {
    const gridRef = useRef();
    const { getAccessTokenSilently } = useAuth0();
    
    // Row Data: The data to be displayed.
    const [ rowData, setRowData ] = useState(rowInfo);
    const [ undos, setUndos ] = useState([]);
    const [ redos, setRedos ] = useState([]);
    // Column Definitions: Defines the columns to be displayed.
    const [ colDefs, setColDefs ] = useState(colNames);
    // const [editedRows, setEditedRows] = useState([]);

    // Save edited cells to state
    const onCellValueChanged = async (params) => {
        setRedos([]);
        const edited_row_data = params.data;
        // setEditedRows(prev => {
        //     const updated = [...prev]
        //     const idx = updated.findIndex(val => val._id === edited_row_data._id);
        //     if (idx === -1) {
        //         updated.push(edited_row_data);
        //     } else {
        //         updated[idx] = edited_row_data;
        //     }
        //     return updated;
        // });
        
        const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
        try {
            await updateTransactions(token, edited_row_data);
            const column = params.column.colId;
            
            setUndos((prev) => {
                if (prev) {
                    return [...prev, {...edited_row_data, [column]: params.oldValue}]
                } else {
                    return [{...edited_row_data, [column]: params.oldValue}]
                };
            });
        } catch (err) {
            console.error(err);
        };
    };

    // On save button press, reflect changes to rows in db
    

    return (
        <>
            {/* Data Grid will fill the size of the parent container */}
            <div style={{ height: 500, width: 1100 }}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={colDefs}
                    onCellValueChanged={onCellValueChanged}
                    getRowId={params => params.data._id}
                />
            </div>

            {undos.length > 0 ? (
                <button onClick={() => { 
                    // console.log('Undos', undos);
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
                    setRowData(prevRows => {
                        return prevRows.map(row => row._id === mostRecentUndo._id ? mostRecentUndo : row);
                    });
                    setUndos(undosPopped);
                }}> Undo </button> )  
                : ( <button disabled> Undo </button> )
            }

            {console.log('Redos', redos)}

            {redos.length > 0 ? (
                <button onClick={() => {
                    const redosPopped = [...redos];
                    const mostRecentRedo = redosPopped.pop();

                    // add row state before redo to undo
                    console.log(rowData)
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
                    setRowData(prevRows => {
                        return prevRows.map(row => row._id === mostRecentRedo._id ? mostRecentRedo : row);
                    });
                    setRedos(redosPopped);

                }}> Redo </button>
            ) : ( <button disabled > Redo </button> )}

            {console.log('Undos', undos)}
            {/* <button onClick={saveEditedRows}>Save</button> */}
        </>
    )
}

export default EditableGrid;