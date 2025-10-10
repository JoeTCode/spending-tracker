import { AllCommunityModule, ModuleRegistry, colorSchemeDark, themeQuartz } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component

const darkMode = themeQuartz.withPart(colorSchemeDark);
const lightMode = themeQuartz;
// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);


const EditableGrid = ({ gridRef, rowData, colNames, onCellChange, rowSelection=undefined, onSelectionChanged=undefined }) => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Save edited cells to state
    
    const onCellValueChanged = async (params) => {
        const edited_row_data = params.data;
        onCellChange(edited_row_data, params);
        
    };

    // On save button press, reflect changes to rows in db
    return (
        <>
            {/* Data Grid will fill the size of the parent container */}
            <AgGridReact
                theme={isDarkMode ? darkMode : lightMode}
                ref={gridRef}
                rowData={rowData}
                columnDefs={colNames}
                onCellValueChanged={onCellValueChanged}
                getRowId={params => params.data._id}
                rowSelection={rowSelection}
                onSelectionChanged={onSelectionChanged}
            />
        </>
    )
}

export default EditableGrid;