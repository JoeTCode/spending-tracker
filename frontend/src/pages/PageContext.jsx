import { createContext, useContext, useReducer } from "react";

const PageContext = createContext();

const storedCorrections = localStorage.getItem('corrections');
const initialState = {
	corrections: storedCorrections ? parseInt(storedCorrections, 10) : 0,
	allowCategorisation: localStorage.getItem('allowCategorisation') ? localStorage.getItem('allowCategorisation') === 'true' : true,
	modelType: localStorage.getItem('modelType') ?? 'globalModel',
};

const pageReducer = (state, action) => {
    switch (action.type) {
        case "SET_CORRECTIONS": {
            localStorage.setItem("corrections", action.payload);
            return { ...state, corrections: action.payload }
        };
		case "SET_ALLOW_CATEGORISATION": {
			localStorage.setItem('allowCategorisation', action.payload);
			return { ...state, allowCategorisation: action.payload }
		};
		case "SET_MODEL_TYPE": {
			localStorage.setItem('modelType', action.payload);
			return { ...state, modelType: action.payload }
		}

        default: return state;
    };
};

export const PageProvider = ({ children }) => {
	const [ state, dispatch ] = useReducer(pageReducer, initialState);

	return (
		<PageContext.Provider
			value={{ state, dispatch }}
		>
			{children}
		</PageContext.Provider>
	);
};

export const usePage = () => useContext(PageContext);