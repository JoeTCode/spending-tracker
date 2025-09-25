import { NavBar, StackedBarChart, PieChart, LineChart } from '../components';
import { SpendingComparison, TransactionsOverview, UpcomingPayments, MostRecentTransactions } from '../components/widgets';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChevronRight from '../assets/icons/chevron-right-svgrepo-com.svg?react';

const YearDropdown = ({ startYearOffset = 10, onChange }) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: startYearOffset + 1 },
        (_, i) => currentYear - i
    );

    const [selectedYear, setSelectedYear] = useState(currentYear);

    const handleChange = (e) => {
        const year = parseInt(e.target.value, 10);
        setSelectedYear(year);
        if (onChange) onChange(year);
    };

    return (
        <select 
            value={selectedYear}
            onChange={handleChange}
            className="p-2 cursor-pointer rounded-lg bg-[#1a1818] text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
            {years.map((year) => (
                <option key={year} value={year}>
                {year}
                </option>
            ))}
        </select>
    );
};

const Dashboard = () => {
    const options = ["Past Week", "Past Month", "Past 3 Months", "Past Year", "All Time"];
    const [ selected, setSelected ] = useState(options[options.length - 1]);
    const [ paymentCount, setPaymentCount ] = useState(0);
    const [ showAllPayments, setShowAllPayments ] = useState(false);
    const [ lineChartSelectedYear, setLineChartSelectedYear ] = useState(new Date().getFullYear());
    const [ barChartSelectedYear, setBarChartSelectedYear ] = useState(new Date().getFullYear());

    return (

        <>
            <NavBar />
            <div className='flex flex-col items-center mx-10 sm:mx-5 md:mx-24 md:mt-[10%] lg:mt-[5%]'>
                <div className="mt-12 grid grid-cols-1 mb-10 gap-5 lg:grid-cols-3 lg:gap-4 lg:min-w-[1000px] xl:min-w-[1300px]">
                    <div>
                        <div>
                            <p className="font-medium text-xl mb-5">Overview</p>
                        </div>

                        <div>
                            <TransactionsOverview />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-baseline">
                            <p className='font-medium text-xl mb-5 flex items-center'>
                                Upcoming Payments 
                                {paymentCount > 0 && (
                                    <span className="bg-red-600 text-white rounded-full w-6 h-6 flex text-center items-center justify-center ml-3 text-sm font-bold relative top-[2px]">
                                        {paymentCount}
                                    </span>
                                )}
                            </p>
                            <div className="flex gap-x-1 text-sm text-gray-400 hover:text-gray-600 cursor-pointer" onClick={() => setShowAllPayments(true)} >
                                <p>View All</p>
                                <ChevronRight className='w-3 h-3 relative top-[5px]'/>
                            </div>
                        </div>

                        <div>
                            <UpcomingPayments setPaymentCount={setPaymentCount} showAllPayments={showAllPayments} setShowAllPayments={setShowAllPayments}/>
                        </div>
                    </div>

                    <div className="lg:row-span-2">
                        <div className="flex justify-between items-baseline">
                            <p className='font-medium text-xl mb-5'>Recent transactions</p>
                            <p className="text-sm text-gray-400 cursor-pointer" >
                                <Link 
                                    to="/transactions" 
                                    className="flex gap-x-1 no-underline text-gray-400 hover:text-gray-600"
                                >
                                    <p>View All</p>
                                    <ChevronRight className='w-3 h-3 relative top-[5px]'/>
                                </Link>
                            </p>
                        </div>
                        <div>
                            <MostRecentTransactions />
                        </div>  
                    </div>

                    <div className="h-[500px] sm:h-[420px] lg:col-span-2 lg:h-[530px] flex flex-col">
                        <div className="flex justify-between items-baseline">
                            <p className='font-medium text-xl mb-5'>Income / Spending Breakdown</p>
                            {/* <p className="text-sm text-gray-400">This calendar year</p> */}
                            <YearDropdown onChange={setBarChartSelectedYear}/>
                        </div>
                        <div className='flex-1 min-h-0'>
                            <StackedBarChart selectedYear={barChartSelectedYear} />
                        </div>
                        
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:gap-4 lg:col-span-3 lg:grid-cols-2">
                        <div className='mt-[3px]'>
                            <div className="flex justify-between items-baseline">
                                <p className='font-medium text-xl mb-5'>Income / Spending Trends</p>
                                <YearDropdown onChange={setLineChartSelectedYear}/>
                            </div>
                            <LineChart selectedYear={lineChartSelectedYear} />
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline">
                                <p className='font-medium text-xl mb-5'>Spending per category</p>
                                <select
                                    value={selected}
                                    onChange={(e) => setSelected(e.target.value)}
                                    className="p-2 cursor-pointer rounded-lg bg-[#1a1818] text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
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

                    <div className="lg:col-span-3">
                        <div className="flex justify-between items-baseline mb-5">
                            <p className='font-medium text-xl'>Spending comparisons</p>
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