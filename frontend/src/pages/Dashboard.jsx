import { NavBar, StackedBarChart, PieChart, LineChart } from '../components';
import { SpendingComparison, TransactionsOverview, UpcomingPayments, MostRecentTransactions } from '../components/widgets';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';


const Dashboard = () => {
    const navigate = useNavigate();

    return (

        <>
            <NavBar />
             <h1>Dashboard</h1>
            <div className='flex flex-col items-center mx-5'>
                <div className="mt-12 grid grid-cols-1 mb-10 gap-5 sm:grid-cols-3 md:gap-4 lg:min-w-[1100px] xl:min-w-[1400px]">
                    {/* B */}
                    <div className="mt-12 h-[200px] sm:h-[200px]">
                        <div><p className='font-semibold text-xl mb-5'>Overview</p></div>
                        <TransactionsOverview />
                    </div>

                    {/* C */}
                    <div className="mt-12 h-[200px] sm:h-[200px]">
                        <div className="flex justify-between items-baseline">
                            <p className='font-semibold text-xl mb-5'>Upcoming Payments</p>
                            <p className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">View All <span className='ml-1.5'>&gt;</span></p>
                        </div>
                        <UpcomingPayments />
                    </div>

                    {/* A: spans 2 rows */}
                    <div className="mt-12 sm:row-span-2">
                        <div className="flex justify-between items-baseline">
                            <p className='font-semibold text-xl mb-5'>Recent transactions</p>
                            <p className="text-sm text-gray-400 cursor-pointer" >
                                <Link 
                                    to="/transactions" 
                                    className="no-underline text-gray-400 hover:text-gray-600"
                                >
                                    View All <span className='ml-1.5'>&gt;</span>
                                </Link>
                            </p>
                        </div>
                        <div>
                            <MostRecentTransactions />
                        </div>  
                    </div>

                    {/* D: spans 2 columns */}
                    <div className="h-[600px] sm:col-span-2 sm:h-[400px]">
                        <div className="flex justify-between items-baseline">
                            <p className='font-semibold text-xl mb-5'>Income / Spending Breakdown</p>
                            <p className="text-sm text-gray-400">This calendar year</p>
                        </div>
                        
                        <StackedBarChart />
                    </div>

                    <div className=" mt-12 grid grid-cols-1 gap-5 sm:gap-4 sm:col-span-3 sm:grid-cols-2">
                        <div>
                            <div className="flex justify-between items-baseline">
                                <p className='font-semibold text-xl mb-5'>Income / Spending Trends</p>
                                <p className="text-sm text-gray-400">This calendar year</p>
                            </div>
                            
                            <LineChart />
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline">
                                <p className='font-semibold text-xl mb-5'>Spending per category</p>
                                <p className="text-sm text-gray-400">All time</p>
                            </div>
                            
                            <PieChart />
                        </div>
                    </div>

                    {/* G: spans all 3 columns */}
                    <div className="sm:col-span-3">
                        <div className="flex justify-between items-baseline mb-5">
                            <p className='font-semibold text-xl'>Spending comparisons</p>
                            <p className="text-sm text-gray-400">Compared to last month</p>
                        </div>
                        <SpendingComparison />
                    </div>
                </div>
            </div>
            
        </>
        
    )
}

export default Dashboard