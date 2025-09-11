import { NavBar, StackedBarChart, PieChart, LineChart } from '../components';
import { SpendingComparison, TransactionsOverview, UpcomingPayments, MostRecentTransactions } from '../components/widgets';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';


const Dashboard = () => {
    const navigate = useNavigate();
    const options = ["Past Week", "Past Month", "Past 3 Months", "Past Year", "All Time"];
    const [ selected, setSelected ] = useState(options[options.length - 1]);
    const [ paymentCount, setPaymentCount ] = useState(0);
    const [ showAllPayments, setShowAllPayments ] = useState(false);
    const handleChange = (e) => {
        setSelected(e.target.value)
    };

    return (

        <>
            <NavBar />
            <div className='flex flex-col items-center mx-10 sm:mx-5 md:mx-24'>
                <div className="mt-12 grid grid-cols-1 mb-10 gap-5 lg:grid-cols-3 lg:gap-4 lg:min-w-[1000px] xl:min-w-[1300px]">
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
                            <p className='font-semibold text-xl mb-5 flex'>Upcoming Payments 
                                {paymentCount > 0 && (
                                    <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center ml-2 text-sm font-bold">
                                        {paymentCount}
                                    </span>
                                )}
                            </p>
                            <p className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer" onClick={() => setShowAllPayments(true)} >
                                View All <span className='ml-1.5'>&gt;</span>
                            </p>
                        </div>

                        <div>
                            <UpcomingPayments setPaymentCount={setPaymentCount} showAllPayments={showAllPayments} setShowAllPayments={setShowAllPayments}/>
                        </div>
                    </div>

                    {/* A: spans 2 rows */}
                    <div className="lg:row-span-2">
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
                    <div className="h-[500px] sm:h-[420px] lg:col-span-2 lg:h-[530px] flex flex-col">
                        <div className="flex justify-between items-baseline">
                            <p className='font-semibold text-xl mb-5'>Income / Spending Breakdown</p>
                            <p className="text-sm text-gray-400">This calendar year</p>
                        </div>
                        <div className='flex-1 min-h-0'>
                            <StackedBarChart />
                        </div>
                        
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:gap-4 lg:col-span-3 lg:grid-cols-2">
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
                    <div className="lg:col-span-3">
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