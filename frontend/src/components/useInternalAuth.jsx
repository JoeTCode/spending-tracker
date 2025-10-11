import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

const AuthContext = createContext();

export const InternalAuthProvider = ({ children }) => {
    const [ user, setUser ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const { getAccessTokenSilently, isAuthenticated, logout: auth0Logout } = useAuth0();
    const refreshingRef = useRef(false);

    useEffect(() => {
        const registerAuth0User = async () => {
            if (isAuthenticated) {
                const token = await getAccessTokenSilently();

                try {
                    await axios.post(
                        import.meta.env.VITE_API_URL + "/auth0/register",
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                } catch (err) {
                    console.error(err);
                };
            };
        };

        registerAuth0User();

    }, [isAuthenticated])

    // Run once on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        if (isAuthenticated) return;
        
        // for react strict mode
        if (refreshingRef.current) return; // skip if already running
        refreshingRef.current = true;

        try {
            const res = await axios.get(import.meta.env.VITE_API_URL + "/api/me", {
                withCredentials: true,
            });

            setUser(res.data);

        } catch {
            try {
                const res = await axios.post(
                    import.meta.env.VITE_API_URL + "/refresh",
                    {},
                    { withCredentials: true },
                );
                setUser(res.data);
            } catch (err) {
                setUser(null);
            };

        } finally {
            refreshingRef.current = false;
            setLoading(false);
        };
    };

    const login = async (username, password) => {
        try {
            await axios.post(
                import.meta.env.VITE_API_URL + "/login",
                { username, password },
                { withCredentials: true }
            );
            await checkAuth(); // update user after successful login
        } catch (err) {
            setUser(null);
            return;
        };
    };

    const logout = async () => {
        // logout via auth0
        if (isAuthenticated) {
            await auth0Logout();
            return;
        };
        
        // revokes tokens stored in cookies refresh token in db
        await axios.post(import.meta.env.VITE_API_URL + "/logout", {}, { withCredentials: true });
        // clear user immediately
        setUser(null); 
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useInternalAuth = () => useContext(AuthContext);