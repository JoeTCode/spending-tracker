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
    const [ prevRow, setPrevRow ] = useState(null);
    // Column Definitions: Defines the columns to be displayed.
    const [ colDefs, setColDefs ] = useState(colNames);
    // const [editedRows, setEditedRows] = useState([]);

    // Save edited cells to state
    const onCellValueChanged = async (params) => {
        const edited_row_data = params.data
        console.log(params.oldValue)
        console.log(params.column)
        console.log(params.rowIndex)
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
            setPrevRow(params.oldValue)
            const column = params.column.colId
            const prevRow = {...edited_row_data, [column]: params.oldValue}
            localStorage.setItem('prevRow', JSON.stringify(prevRow))
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
            {prevRow ? (
                <button type='button' onClick={() => { 
                    const data = localStorage.getItem('prevRow');
                    const parsed = JSON.parse(data);
                    console.log('Prev Row', parsed);
                    gridRef.current.api.applyTransaction({
                        update: [parsed]
                    });
                    setPrevRow(null);
                }}> Undo </button> )  
                : ( <button disabled> Undo </button> )
            }
            
            {/* <button onClick={saveEditedRows}>Save</button> */}
        </>
    )
}

export default EditableGrid;