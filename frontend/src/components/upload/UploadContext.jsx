import { createContext, useContext, useReducer, useState } from "react";

const UploadContext = createContext();

const initialState = {
	transactions: [],
	lowConfidenceTransactions: [],
	saveData: [],
	duplicateRows: [],
	absoluteDuplicateRows: [],
	nonDuplicateRows: [],
	columnNames: [],
	parsedCSV: [],
	dateFormat: [],
	// booleans
	previewCSV: false,
	fileParsed: false,
	allowCategorisation: true,
	duplicateWarning: false,
	mapColumns: false,
};

const uploadReducer = (state, action) => {
  switch (action.type) {
    case "SET_TRANSACTIONS": return { ...state, transactions: action.payload };
	case "SET_LOW_CONFIDENCE_TRANSACTIONS": return { ...state, lowConfidenceTransactions: action.payload };
	case "FILTER_LOW_CONFIDENCE_TRANSACTIONS":
    return {
        ...state,
        lowConfidenceTransactions: state.lowConfidenceTransactions.filter(
          	tx => !action.payload.has(tx._id)
        ),
    };
	case "SET_SAVE_DATA": return { ...state, saveData: action.payload };
    case "SET_DUPLICATE_ROWS": return { ...state, duplicateRows: action.payload };
	case "SET_ABSOLUTE_DUPLICATE_ROWS": return { ...state, absoluteDuplicateRows: action.payload };
	case "SET_NON_DUPLICATE_ROWS": return { ...state, nonDuplicateRows: action.payload };
	case "SET_COLUMN_NAMES": return { ...state, columnNames: action.payload };
	case "SET_PARSED_CSV": return { ...state, parsedCSV: action.payload };
	case "SET_DATE_FORMAT": return { ...state, dateFormat: action.payload };
	// booleans
	case "SET_PREVIEW_CSV": return { ...state, previewCSV: action.payload };
    case "SET_FILE_PARSED": return { ...state, fileParsed: action.payload };
	case "SET_ALLOW_CATEGORISATION": return { ...state, allowCategorisation: action.payload };
	case "SET_DUPLICATE_WARNING": return { ...state, duplicateWarning: action.payload };
    case "SET_MAP_COLUMNS": return { ...state, mapColumns: action.payload };
    default: return state;
  };
};

export const UploadProvider = ({ children }) => {
	// const [ transactions, setTransactions ] = useState([]); // list of dicts
	// const [ saveData, setSaveData ] = useState([]);
	// const [ absoluteDuplicateRows, setAbsoluteDuplicateRows ] = useState([]);
	// const [ duplicateRows, setDuplicateRows ] = useState([]);
	// const [ lowConfTx, setLowConfTx ] = useState([]);
	// const [ parsedCSV, setParsedCSV ] = useState([]);
	// const [ columnNames, setColumnNames ] = useState([]);

	// const [ duplicateWarning, setDuplicateWarning ] = useState(false);
	// const [ fileParsed, setFileParsed ] = useState(false);
	// const [ previewCSV, setPreviewCSV ] = useState(false);
	// const [ allowCategorisation, setAllowCategorisation ] = useState(true);
	// const [ mapColumns, setMapColumns ] = useState(false);

	const [ state, dispatch ] = useReducer(uploadReducer, initialState);

	return (
		<UploadContext.Provider
			value={{ state, dispatch }}
		>
			{children}
		</UploadContext.Provider>
	);
};

export const useUpload = () => useContext(UploadContext);