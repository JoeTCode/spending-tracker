import { AllCommunityModule, ModuleRegistry, colorSchemeDark, themeQuartz } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import React, { useState } from 'react';

const myTheme = themeQuartz.withPart(colorSchemeDark);
// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);


const EditableGrid = ({ gridRef, rowData, colNames, onCellChange }) => {
    // Column Definitions: Defines the columns to be displayed.

    // Save edited cells to state
    
    const onCellValueChanged = async (params) => {
        console.log('params', params)
        const edited_row_data = params.data;
        onCellChange(edited_row_data, params);
        
    };

    // On save button press, reflect changes to rows in db
    return (
        <>
            {/* Data Grid will fill the size of the parent container */}
            <AgGridReact
                theme={myTheme}
                ref={gridRef}
                rowData={rowData}
                columnDefs={colNames}
                onCellValueChanged={onCellValueChanged}
                getRowId={params => params.data._id}
            />
        </>
    )
}

export default EditableGrid;