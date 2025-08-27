import { NavBar, AreaFillChart, StackedBarChart, PieChart } from '../components';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';

const Dashboard = () => {

    return (
        <>
            <NavBar />
            <h1>Dashboard</h1>
            
            <AreaFillChart />
            
            <StackedBarChart />

            <PieChart />
        </>
    )
}

export default Dashboard