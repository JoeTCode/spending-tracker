import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MONTHS, CATEGORIES } from '../utils/constants/constants.js';
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
            className={`custom-tooltip 
              z-[9999] pointer-events-auto 
              p-5 pt-3 pr-7
              bg-white border rounded-lg shadow-lg text-sm
              ${isVisible ? 'visible' : 'invisible'}`
            }
            onClick={(e) => e.stopPropagation()}
        >
            {isVisible && (
                <>
                    {/* Month title */}
                    <p className="label font-bold mb-3 text-gray-700">{`${label}`}</p>

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
                        className='cursor-pointer'
                    >
                        <p className='text-gray-600 font-semibold'>
                            <span className='mr-1 text-gray-600 font-semibold'>
                                {showExpenseCategories || pinExpenseCategories ? '-' : '+'}
                            </span>
                            {`${payload[1].name}: ${payload[1].value.toFixed(2)}`}
                        </p> 
                    </div>

                    {/* Scrollable section */}
                    {(showExpenseCategories || pinExpenseCategories) && (
                        <div className="max-h-24 overflow-y-auto border-t border-gray-500 mt-2 pt-2 mb-2">
                            {expenseCategories.map((cat, idx) => (
                                <p key={idx} className='text-gray-500'> {cat} </p>
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
                        <p className='mt-3 text-gray-600 font-semibold'>
                            <span className='mr-1 text-gray-600 font-semibold'>
                                {showIncomeCategories || pinIncomeCategories ? '-' : '+'}
                            </span>
                            {`${payload[0].name}: ${payload[0].value.toFixed(2)}`}
                        </p> 
                    </div>

                    {/* Scrollable section */}
                    {(showIncomeCategories || pinIncomeCategories) && (
                        <div className="max-h-24 overflow-y-auto border-t border-gray-500 mt-2 pt-2 ">
                            {incomeCategories.map((cat, idx) => (
                                <p key={idx} className='text-gray-500'> {cat} </p>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const StackedBarChart = ({ selectedYear }) => {
    const [ transactions, setTransactions ] = useState([]);
    const thisMonth = new Date();
    const [ dc, setDc ] = useState(false);

    // Retrieve and format data
    useEffect(() => {
        const retrieveData = async () => {
            const data = await getTransactions({ rangeType: 'y', selectedYear: selectedYear });

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
            
            for (let row of data) {
                const date = new Date(row.date)
                const monthObj = dataByMonth[date.getMonth()];
               
                if (row.amount >= 0) {
                    monthObj.income += row.amount;
                } else {
                    monthObj.expense += Math.abs(row.amount);
                };
            };
            
            setTransactions(dataByMonth);
        };

        retrieveData();
    
    }, [selectedYear]);   

    return ( 
        <>
            <div className="
                w-full h-full
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
                        <Bar dataKey="income" stackId="a" fill="rgba(8, 143, 62, 0.8)"/>
                        <Bar dataKey="expense" stackId="a" fill="rgba(187, 31, 26, 0.5)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
     );
}
 
export default StackedBarChart;

