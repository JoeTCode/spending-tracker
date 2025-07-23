import { NavBar, AreaFillChart, StackedBarChart } from '../components';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';

const Dashboard = () => {

    return (
        <>
            <NavBar />
            <h1>Dashboard</h1>
            
            <AreaFillChart />
            
            <StackedBarChart/>
        </>
    )
}

export default Dashboard