import { NavBar, StackedBarChart, PieChart, LineChart } from '../components';
import { SpendingComparison, TransactionsOverview, UpcomingPayments, MostRecentTransactions } from '../components/widgets';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';

const Dashboard = () => {

    return (
        // <>
        //     <NavBar />
        //     <h1>Dashboard</h1>
        //     <div className='flex flex-col items-center'>
        //         <div className='grid grid-cols-3 m-5 lg:gap-4 lg:min-w-[1100px] xl:min-w-[1200px]'>
        //             <TransactionsOverview />
        //             <MostRecentTransactions />
        //             <UpcomingPayments />
        //         </div>

        //         <div className="grid grid-cols-1 min-h-300 mb-10 md:min-w-[610px] lg:grid-cols-2 lg:gap-4 lg:min-h-100 lg:min-w-[1100px] xl:min-w-[1200px]">
        //             <StackedBarChart />
        //             {/* <AreaFillChart /> */}
        //             <LineChart />
        //             <PieChart />
        //             <SpendingComparison />
        //         </div>
        //     </div>
            
        // </>

        <>
            <NavBar />
             <h1>Dashboard</h1>
            <div className='flex flex-col items-center'>
                <div className="mt-10 grid grid-cols-1 mb-10 gap-5 sm:grid-cols-3 md:gap-4 lg:min-w-[1100px] xl:min-w-[1400px]">
                    {/* B */}
                    <div className="h-[200px] sm:h-[200px]">
                        <p className='font-semibold text-2xl mb-5'>Spending Overview</p>
                        <TransactionsOverview />
                    </div>

                    {/* C */}
                    <div className="h-[200px] sm:h-[200px]">
                        <div className="flex justify-between items-baseline">
                            <p className='font-semibold text-2xl mb-5'>Upcoming Payments</p>
                            <p className="text-sm text-gray-400 cursor-pointer">View All&emsp;&gt;</p>
                        </div>
                        <UpcomingPayments />
                    </div>

                    {/* A: spans 2 rows */}
                    <div className="sm:row-span-2">
                        <div className="flex justify-between items-baseline">
                            <p className='font-semibold text-2xl mb-5'>Recent transactions</p>
                            <p className="text-sm text-gray-400 cursor-pointer">View All&emsp;&gt;</p>
                        </div>
                        <div>
                            <MostRecentTransactions />
                        </div>  
                    </div>

                    {/* D: spans 2 columns */}
                    <div className="sm:col-span-2 h-[600px] sm:h-[400px]">
                        <p className='font-semibold text-2xl mb-5'>Income / Spending Breakdown</p>
                        <StackedBarChart />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:gap-4 sm:col-span-3 sm:grid-cols-2">
                        <div>
                            <p className='font-semibold text-2xl mb-5'>Income</p>
                            <LineChart />
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline">
                                <p className='font-semibold text-2xl mb-5'>Spending per category</p>
                                <p className="text-sm text-gray-400 cursor-pointer">Expand&emsp;&gt;</p>
                            </div>
                            <PieChart />
                        </div>
                    </div>

                    {/* G: spans all 3 columns */}
                    <div className="sm:col-span-3">
                        <div className="flex justify-between items-baseline mb-5">
                            <p className='font-semibold text-2xl'>Spending trends</p>
                            <p className="text-sm text-gray-400">Compared to last week</p>
                        </div>
                        <SpendingComparison />
                    </div>
                </div>
            </div>
            
        </>
        
    )
}

export default Dashboard