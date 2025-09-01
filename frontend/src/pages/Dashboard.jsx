import { NavBar, StackedBarChart, PieChart, LineChart } from '../components';
import { SpendingComparison, TransactionsOverview, UpcomingPayments, MostRecentTransactions } from '../components/widgets';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';

const Dashboard = () => {

    return (
        <>
            <NavBar />
            <h1>Dashboard</h1>
            <div className='flex flex-col items-center'>
                <div className='grid grid-cols-3 m-5 lg:gap-4 lg:min-w-[1100px] xl:min-w-[1200px]'>
                    <TransactionsOverview />
                    <MostRecentTransactions />
                    <UpcomingPayments />
                </div>

                <div className="grid grid-cols-1 min-h-300 mb-10 md:min-w-[610px] lg:grid-cols-2 lg:gap-4 lg:min-h-100 lg:min-w-[1100px] xl:min-w-[1200px]">
                    <StackedBarChart />
                    {/* <AreaFillChart /> */}
                    <LineChart />
                    <PieChart />
                    <SpendingComparison />
                </div>
            </div>
            
        </>
        
    )
}

export default Dashboard