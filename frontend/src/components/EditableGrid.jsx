import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import React, { useState } from 'react';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);


const EditableGrid = ({ gridRef, rowData, colNames, onCellChange }) => {
    // Column Definitions: Defines the columns to be displayed.
    const [ colDefs, setColDefs ] = useState(colNames);

    // Save edited cells to state
    
    const onCellValueChanged = async (params) => {
        const edited_row_data = params.data;
        onCellChange(edited_row_data, params);
        
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
        </>
    )
}

export default EditableGrid;