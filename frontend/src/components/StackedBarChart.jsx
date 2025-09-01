import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MONTHS, CATEGORIES } from '../utils/constants/constants.js';
// import { getTransactions } from '../api/transactions';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';
import { getTransactions } from '../db/db.js';

const CustomTooltip = ({ active, payload, label }) => {
    const isVisible = active && payload && payload.length > 0;
    const [ showExpenseCategories, setShowExpenseCategories ] = useState(false);
    const [ showIncomeCategories, setShowIncomeCategories ] = useState(false);
    const [ pinExpenseCategories, setPinExpenseCategories ] = useState(false);
    const [ pinIncomeCategories, setPinIncomeCategories ] = useState(false);

    function calculateExpenseCategories() {
        if (!isVisible || payload[1].value === 0) return [];

        // Build array of { name, percentage }
        const expenseCategories = Object.entries(payload[1]?.payload.expenseCategories)
            .map(([category, amount]) => ({
                name: category,
                percentage: (amount * 100) / payload[1].value,
            }))
            .filter(cat => Math.round(cat.percentage) > 0);

        // Sort descending by percentage
        expenseCategories.sort((a, b) => b.percentage - a.percentage);

        // Return display strings
        return expenseCategories.map(
            cat => `${cat.name} (${Math.round(cat.percentage)}%)`
        );
    };

    const expenseCategories = calculateExpenseCategories();

    function calculateIncomeCategories() {
        if (!isVisible || payload[0].value === 0) return [];

        // Build array of { name, percentage }
        const incomeCategories = Object.entries(payload[0]?.payload.incomeCategories)
            .map(([category, amount]) => ({
                name: category,
                percentage: (amount * 100) / payload[0].value,
            }))
            .filter(cat => Math.round(cat.percentage) > 0);

        // Sort descending by percentage
        incomeCategories.sort((a, b) => b.percentage - a.percentage);

        // Return display strings
        return incomeCategories.map(
            cat => `${cat.name} (${Math.round(cat.percentage)}%)`
        );
    };

    const incomeCategories = calculateIncomeCategories();

    return (
        <div 
            className={`
                    custom-tooltip ${isVisible ? 'visible' : 'hidden'} z-[9999] pointer-events-auto
                    bg-[#524e99e0] px-5 pt-2 pb-5 rounded-lg
                `}
            onClick={(e) => e.stopPropagation()}
        >
            {isVisible && (
                <>
                    {/* Month title */}
                    <p className='label mb-3 font-bold'>{`${label}`}</p>

                    {/* expenses */}
                    <div 
                        onMouseEnter={() => {
                            if (!pinExpenseCategories) {
                                setShowExpenseCategories(true);
                            };
                        }}
                        onMouseLeave={() => setShowExpenseCategories(false)}
                        onClick={() => {
                            setShowExpenseCategories(false);
                            setPinExpenseCategories(prev => !prev)
                        }}
                        className='cursor-pointer mb-3'
                    >
                        <p>
                            <span className='mr-1'>
                                {showExpenseCategories || pinExpenseCategories ? '-' : '+'}
                            </span>
                            {`${payload[1].name}: ${payload[1].value.toFixed(2)}`}
                        </p> 
                    </div>

                    {/* {showExpenseCategories && <p>{expenseCategories.join(', ')}</p>}
                    {pinExpenseCategories && <p>{expenseCategories.join(', ')}</p>} */}

                    {/* Scrollable section */}
                    {(showExpenseCategories || pinExpenseCategories) && (
                        <div className="max-h-24 overflow-y-auto border-t mt-1 pt-2 mb-2">
                            {expenseCategories.map((cat, idx) => (
                                <p key={idx}>{cat}</p>
                            ))}
                        </div>
                    )}
                    
                    {/* income */}
                    <div 
                        onMouseEnter={() => {
                            if (!pinIncomeCategories) {
                                setShowIncomeCategories(true);
                            }                         
                        }}
                        onMouseLeave={() => setShowIncomeCategories(false)}
                        onClick={() =>{
                            setShowIncomeCategories(false);
                            setPinIncomeCategories(prev => !prev);
                        }}
                        className='cursor-pointer'
                    >
                        <p>
                            <span className='mr-1'>
                                {showIncomeCategories || pinIncomeCategories ? '-' : '+'}
                            </span>
                            {`${payload[0].name}: ${payload[0].value.toFixed(2)}`}
                        </p> 
                    </div>

                    {/* {showIncomeCategories && <p>{incomeCategories.join(', ')}</p>}
                    {pinIncomeCategories && <p>{incomeCategories.join(', ')}</p>} */}

                    {/* Scrollable section */}
                    {(showIncomeCategories || pinIncomeCategories) && (
                        <div className="max-h-24 overflow-y-auto border-t mt-1 pt-2">
                            {incomeCategories.map((cat, idx) => (
                                <p key={idx}>{cat}</p>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const StackedBarChart = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [ transactions, setTransactions ] = useState([]);
    const thisMonth = new Date();
    const [ selectedMonth, setSelectedMonth ] = useState(thisMonth.getMonth());
    // const [ totalExpenses, setTotalExpenses ] = useState(0);
    // const [ totalIncome, setTotalIncome ] = useState(0);
    const [ dc, setDc ] = useState(false);

    // Retrieve and format data
    useEffect(() => {
        const retrieveData = async () => {
            const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            const data = await getTransactions('y');
            // console.log(data);
            const makeCategoryDict = () => {
                const dict = {};
                for (let category of CATEGORIES) {
                    dict[category] = 0;
                }
                return dict;
            };

            const dataByMonth = []
            // create defualt objects for each month and populate them later
            for (let i = 0; i < 12; i++) {
                dataByMonth.push({
                    'month': MONTHS[i].substring(0, 3),
                    'income': 0,
                    'expense': 0,
                    'expenseCategories': makeCategoryDict(),
                    'incomeCategories': makeCategoryDict()
                });
            };
            
            // categorisation logic here
            for (let row of data) {
                const date = new Date(row.date)
                const monthObj = dataByMonth[date.getMonth()];
                const category = row['category'];
                const amount = row['amount'];
                if (amount === 0) {
                    continue;
                }
                else if (amount > 0) {
                    monthObj['incomeCategories'][category] += Number(amount);
                }
                else {
                    monthObj['expenseCategories'][category] += Math.abs(Number(amount));
                };
            };
            
            // let tempIncome = 0;
            // let tempExpenses = 0;
            for (let row of data) {
                const date = new Date(row.date)
                const monthObj = dataByMonth[date.getMonth()];
               
                if (row.amount >= 0) {
                    monthObj.income += row.amount;
                    // tempIncome += row.amount;
                } else {
                    monthObj.expense += Math.abs(row.amount)
                    // tempExpenses += Math.abs(row.amount);
                };
            };
            
            // setTotalIncome(tempIncome);
            // setTotalExpenses(tempExpenses);
            setTransactions(dataByMonth);
        };

        retrieveData();
    
    }, []);   

    return ( 
        <>
            <div className="
                w-full md:h-[300px] xl:h-[400px] 2xl:h-[400px] p-5
                rounded-lg bg-[#1a1818] shadow-lg
            ">
                <ResponsiveContainer>
                    <BarChart
                        data={transactions}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                        onClick={() => {
                            setDc((prev) => !prev);
                        }}
                        onMouseLeave={() => setDc(false)}
                    >
                        {/* <CartesianGrid strokeDasharray="2 5" /> */}
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                            trigger= {dc ? 'click' : 'hover'}
                            content={CustomTooltip}
                            cursor={{ fill: "#8884d880" }}
                        />
                        <Legend />
                        <Bar dataKey="income" stackId="a" fill="#3fad44E6"/>
                        <Bar dataKey="expense" stackId="a" fill="#b34f36E6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
     );
}
 
export default StackedBarChart;

