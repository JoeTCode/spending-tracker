import { createContext, useContext, useReducer } from "react";

const PageContext = createContext();

const storedCorrections = localStorage.getItem('corrections');
const initialState = {
	corrections: storedCorrections ? parseInt(storedCorrections, 10) : 0,
};

const pageReducer = (state, action) => {
    switch (action.type) {
        case "SET_CORRECTIONS": {
            localStorage.setItem("corrections", action.payload);
            return { ...state, corrections: action.payload }
        };
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