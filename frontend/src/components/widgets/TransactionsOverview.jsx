import React, { useState, useEffect } from 'react';
import { getTransactions } from '../../db/db.js';

// #242424 dark theme

const TransactionsOverviewCard = () => {
    const [ transactions, setTransactions ] = useState([]);
    const [ totalIncome, setTotalIncome ] = useState(0);
    const [ totalExpenses, setTotalExpenses ] = useState(0);
    
    useEffect(() => {
        const getTx = async () => {
            const transactions = await getTransactions('y');
            setTransactions(transactions);
        };

        getTx();
    }, []);

    useEffect(() => {
        let income = 0;
        let expenses = 0;

        for (let row of transactions) {
            if (row.amount >= 0) {
                income += row.amount;
            } else {
                expenses += Math.abs(row.amount)
            };
        };

        setTotalIncome(income);
        setTotalExpenses(expenses);
    }, [transactions]);

    return (
        // <div className='m-20 rounded-lg bg-[#1a1818] max-w-100 max-h-50 shadow-lg'>
        <div className='rounded-lg bg-[#1a1818] max-w-150 max-h-50 shadow-lg'>
            <div className='grid grid-cols-1 gap-5 justify-self-center m-5'>
                <div > Net: {(totalIncome - totalExpenses).toFixed(2)} </div>
                <div> Total Expenses: {totalExpenses.toFixed(2)} </div>
                <div> Total Income: {totalIncome.toFixed(2)} </div>
            </div>
            
            
            
            
        </div>
    );
};

export default TransactionsOverviewCard;