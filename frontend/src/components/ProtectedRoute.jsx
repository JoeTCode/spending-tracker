import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from "react-router-dom";
import { useInternalAuth } from './useInternalAuth';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth0();
    const { user, loading } = useInternalAuth();

    if (isLoading || loading) return <div>Loading...</div>
    
    return user || isAuthenticated ? children : <Navigate to='/login' />
};

export default ProtectedRoute