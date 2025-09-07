import { NavBar, StackedBarChart, PieChart, LineChart } from '../components';
import { SpendingComparison, TransactionsOverview, UpcomingPayments, MostRecentTransactions } from '../components/widgets';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';


const Dashboard = () => {
    const navigate = useNavigate();
    const options = ["Past Week", "Past Month", "Past 3 Months", "Past Year", "All Time"];
    const [selected, setSelected] = useState(options[options.length - 1]);
    
    const handleChange = (e) => {
        setSelected(e.target.value)
    };

    return (

        <>
            <NavBar />
             <h1>Dashboard</h1>
            <div className='flex flex-col items-center mx-10 sm:mx-5'>
                <div className="mt-12 grid grid-cols-1 mb-10 gap-5 md:grid-cols-3 md:gap-4 lg:min-w-[1100px] xl:min-w-[1400px]">
                    {/* B */}
                    <div>
                        <div>
                            <p className="font-semibold text-xl mb-5">Overview</p>
                        </div>

                        <div>
                            <TransactionsOverview />
                        </div>
                    </div>

                    {/* C */}
                    {/* <div className="mt-12 h-[200px]">
                        <div className="flex justify-between items-baseline">
                            <p className='font-semibold text-xl mb-5'>Upcoming Payments</p>
                            <p className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">View All <span className='ml-1.5'>&gt;</span></p>
                        </div>
                        <UpcomingPayments />
                    </div> */}

                    <div>
                        <div className="flex justify-between items-baseline">
                            <p className='font-semibold text-xl mb-5'>Upcoming Payments</p>
                            <p className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
                                View All <span className='ml-1.5'>&gt;</span>
                            </p>
                        </div>

                        <div>
                            <UpcomingPayments />
                        </div>
                    </div>

                    {/* A: spans 2 rows */}
                    <div className="md:row-span-2">
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
                    <div className="h-[500px] sm:h-[420px] md:col-span-2 md:h-[530px] flex flex-col">
                        <div className="flex justify-between items-baseline">
                            <p className='font-semibold text-xl mb-5'>Income / Spending Breakdown</p>
                            <p className="text-sm text-gray-400">This calendar year</p>
                        </div>
                        <div className='flex-1 min-h-0'>
                            <StackedBarChart />
                        </div>
                        
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:gap-4 md:col-span-3 md:grid-cols-2">
                        <div className='mt-[3px]'>
                            <div className="flex justify-between items-baseline">
                                <p className='font-semibold text-xl mb-5'>Income / Spending Trends</p>
                                <p className="text-sm text-gray-400">This calendar year</p>
                            </div>
                            
                            <LineChart />
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline">
                                <p className='font-semibold text-xl mb-5'>Spending per category</p>
                                {/* <p className="text-sm text-gray-400">All time</p> */}
                                <select
                                    value={selected}
                                    onChange={handleChange}
                                    className="w-34 p-2 cursor-pointer rounded-lg bg-[#1a1818] text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    {options.map((opt, idx) => (
                                        <option key={idx} value={opt} className='text-sm'>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <PieChart range={selected} />
                        </div>
                    </div>

                    {/* G: spans all 3 columns */}
                    <div className="md:col-span-3">
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