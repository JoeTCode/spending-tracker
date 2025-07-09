import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const Navbar = () => {
    const { isAuthenticated, isLoading, logout } = useAuth0();
    if (isLoading) {
        return <div></div>
    }
    

    return (    
        <div>
            <div>
                <Link to="/">Home</Link>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/transactions">Transactions</Link>
                {isAuthenticated ? <button onClick={
                    () => logout({ logoutParams: { returnTo: 'http://localhost:5173/login' } })
                }>Log Out</button> : null}
            </div>
        </div>
    )
}

export default Navbar;