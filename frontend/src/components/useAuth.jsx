import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [ user, setUser ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const { logout: auth0Logout } = useAuth0();

    // Run once on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/me", {
                withCredentials: true,
            });
            console.log(res);
            setUser(res.data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        };
    };

    const login = async (username, password) => {
        await axios.post(
            "http://localhost:5000/login",
            { username, password },
            { withCredentials: true }
        );
        await checkAuth(); // update user after login
    };

    const logout = async () => {
        // revokes tokens stored in cookies refresh token in db
        await axios.post("http://localhost:5000/logout", {}, { withCredentials: true });

        // logout via auth0 aswell
        await auth0Logout();

        // clear user immediately
        setUser(null); 
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);