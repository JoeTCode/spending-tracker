import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { updateTransactions } from '../api/transactions';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const EditableGrid = ({ rowInfo, colNames }) => {
    const { getAccessTokenSilently } = useAuth0();
    
    // Row Data: The data to be displayed.
    const [rowData, setRowData] = useState(rowInfo);
    
    // Column Definitions: Defines the columns to be displayed.
    const [colDefs, setColDefs] = useState(colNames);
    const [editedRows, setEditedRows] = useState([]);
    
    // Save edited cells to state
    const onCellValueChanged = (params) => {
        const edited_row_data = params.data

        setEditedRows(prev => {
            const updated = [...prev]
            const idx = updated.findIndex(val => val._id === edited_row_data._id);
            if (idx === -1) {
                updated.push(edited_row_data);
            } else {
                updated[idx] = edited_row_data;
            }
            return updated;
        });
    };

    // On save button press, reflect changes to rows in db
    const saveEditedRows = async () => {
        const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
        try {
            console.log(editedRows)
            await updateTransactions(token, editedRows);
        } catch (err) {
            console.error(err);
        };
        
    };

    return (
        <>
            {/* Data Grid will fill the size of the parent container */}
            <div style={{ height: 500, width: 1000 }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={colDefs}
                    onCellValueChanged={onCellValueChanged}
                />
            </div>
            <button onClick={saveEditedRows}>Save</button>
        </>
    )
}

export default EditableGrid;