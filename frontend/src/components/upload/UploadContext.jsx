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
	confidenceScores: [],
	stage: "upload",
	corrections: parseInt(localStorage.getItem('corrections')) || 0,
	csvFilename: "",
	// booleans
	loading: false,
	allowCategorisation: localStorage.getItem('allowCategorisation') ? localStorage.getItem('allowCategorisation') === 'true' : true,
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
		case "SET_CONFIDENCE_SCORES": return { ...state, confidenceScores: action.payload };
		case "SET_STAGE": return { ...state, stage: action.payload };
		case "SET_CORRECTIONS": return { ...state, corrections: action.payload };
		case "SET_CSV_FILENAME": return { ...state, csvFilename: action.payload };
		// booleans
		case "SET_LOADING": return { ...state, loading: action.payload };
		case "SET_ALLOW_CATEGORISATION": {
			localStorage.setItem('allowCategorisation', action.payload);
			return { ...state, allowCategorisation: action.payload }
		};
		default: return state;
  	};
};

export const UploadProvider = ({ children }) => {
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