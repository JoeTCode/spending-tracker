import NavBar from '../components/NavBar';
import { useAuth0 } from '@auth0/auth0-react';


const Dashboard = async () => {
    
    const { getAccessTokenSilently } = useAuth0();
    const token = await getAccessTokenSilently();

    return (
        <>
            <NavBar />
            <h1>Dashboard</h1>
        </>
    )
}

export default Dashboard