import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import React, { useRef, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
// import { getTransactions, updateTransactions } from '../api/transactions';
import { train, predict } from '../utils/model';
import { getClientModel, saveClientModel } from '../utils/modelIO';
import { weightAverage } from '../api/globalModel';
// import '../App.css';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);
const CORRECTIONSTRIGGER = 10;

// TEST - UNCOMMENT IMPORT UPON DELTING THIS
async function updateTransactions(val1, val2) {
    
};

const EditableGrid = ({ gridRef, rowData, colNames, onCellChange }) => {
    // const gridRef = useRef();
    const { getAccessTokenSilently } = useAuth0();
    const [ token, setToken ] = useState(null);
    // Row Data: The data to be displayed.
    // const [ rowData, setRowData ] = useState(rowInfo);
    // const [ undos, setUndos ] = useState([]);
    // const [ redos, setRedos ] = useState([]);
    const [ selectedMonth, setSelectedMonth ] = useState(new Date().getMonth());
    // Column Definitions: Defines the columns to be displayed.
    const [ colDefs, setColDefs ] = useState(colNames);
    const [ clientModel, setClientModel ] = useState(null);
    const [correctionsCount, setCorrectionsCount] = useState(() => {
        const saved = localStorage.getItem("count");
        if (saved === null) {
            localStorage.setItem("count", "0");
            return 0;
        }
        return parseInt(saved);
    });

    // const [corrections, setCorrections] = useState(() => {
    //     const saved = localStorage.getItem("corrections");
    //     if (saved === null) {
    //         localStorage.setItem("corrections", JSON.stringify([]));
    //         return [];
    //     }
    //     return JSON.parse(saved);
    // });

    useEffect(() => {
        const getToken = async () => {
            const tokenValue = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            return setToken(tokenValue);
        };
        getToken();
        
    }, []);

    // getClientModel: Set client model on page load - from local storage if available - else load from db and save to localstorage
    useEffect(() => {
        const setClientModelFunction = async () => {
            const model = await getClientModel(token);
            // setClientModel(model);
        };

        // setClientModelFunction();
    }, [token]);

    // If user makes more than CORRECTIONSTRIGGER number of corrections to the grid, train model on any untrained 
    // corrected/not-corrected transactions and perform federated averaging with the global model
    useEffect(() => {
        if (correctionsCount >= CORRECTIONSTRIGGER) {
            const descriptions = corrections.map(correction => correction.description);
            const categories = corrections.map(correction => correction.category);

            const executeWeightAverage = async (model, descriptions, categories) => {
                const trainedModel = await train(model, descriptions, categories);
                const weights = trainedModel.getWeights()
                // post to weight averaging route
                weightAverage(token, weights)
            };
            
            const newModelWeights = executeWeightAverage(clientModel, descriptions, categories);
            const model = saveClientModel(newModelWeights);
            // setClientModel(model);
        };
    }, [correctionsCount])

    // async function undo() {
    //     const undosPopped = [...undos];
    //     const mostRecentUndo = undosPopped.pop()

    //     // add row state before undo to redo
    //     for (const row of rowData) {
    //         if (row._id === mostRecentUndo._id) {
    //             setRedos(prev => {
    //                 if (prev.length > 0) {
    //                     return [...prev, row];
    //                 } else return [row];
    //             });
    //         };
    //     }; 

    //     gridRef.current.api.applyTransaction({
    //         update: [mostRecentUndo]
    //     });

    //     await updateTransactions(token, mostRecentUndo);

    //     setRowData(prevRows => {
    //         return prevRows.map(row => row._id === mostRecentUndo._id ? mostRecentUndo : row);
    //     });
    //     setUndos(undosPopped);
    // };

    // async function redo() {
    //     const redosPopped = [...redos];
    //     const mostRecentRedo = redosPopped.pop();

    //     // add row state before redo to undo
    //     for (const row of rowData) {
    //         if (row._id === mostRecentRedo._id) {
    //             setUndos(prev => {
    //                 if (prev.length > 0) {
    //                     return [...prev, row];
    //                 } else return [row];
    //             });
    //         };
    //     };

    //     gridRef.current.api.applyTransaction({
    //         update: [mostRecentRedo]
    //     });
        
    //     await updateTransactions(token, mostRecentRedo);

    //     setRowData(prevRows => {
    //         return prevRows.map(row => row._id === mostRecentRedo._id ? mostRecentRedo : row);
    //     });
    //     setRedos(redosPopped);
    // };
    
    // Save edited cells to state
    
    const onCellValueChanged = async (params) => {
        // setRedos([]);
        const edited_row_data = params.data;
        onCellChange(edited_row_data, params);
        
        // try {
        //     await updateTransactions(token, edited_row_data);
        //     const column = params.column.colId;
            
        //     setUndos((prev) => {
        //         if (prev) {
        //             return [...prev, {...edited_row_data, [column]: params.oldValue}]
        //         } else {
        //             return [{...edited_row_data, [column]: params.oldValue}]
        //         };
        //     });
        // } catch (err) {
        //     console.error(err);
        // };
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
            {/* {undos.length > 0 ? (
                <button onClick={async () => { await undo() }}> Undo </button> )  
                : ( <button disabled className='disabled-button'> Undo </button> )
            }

            {redos.length > 0 ? (
                <button onClick={async () => { await redo() }}> Redo </button>
            ) : ( <button disabled className='disabled-button'> Redo </button> )} */}

            {/* <button onClick={async () => {
                const prevMonth = new Date()
                prevMonth.setMonth(selectedMonth - 1)
                const prevTransactions = await getTransactions(token, 'vm', prevMonth.getMonth());
                setRowData(prevTransactions);
                setSelectedMonth(prev => {
                    return prev - 1;
                });
            }}>
                Prev
            </button>
            <button onClick={async () => {
                const nextMonth = new Date()
                nextMonth.setMonth(selectedMonth + 1)
                const nextTransactions = await getTransactions(token, 'vm', nextMonth.getMonth());
                setRowData(nextTransactions);
                setSelectedMonth(prev => {
                    return prev + 1;
                });
            }}>
                Next
            </button>
            <button onClick={async () => {
                const allTransactions = await getTransactions(token, 'a');
                setRowData(allTransactions);
            }}>
                All
            </button> */}
        </>
    )
}

export default EditableGrid;