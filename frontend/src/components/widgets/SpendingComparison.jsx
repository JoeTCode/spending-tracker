import React, { useState, useEffect } from 'react';
import { getTransactions } from '../../db/db.js';

const SpendingComparisonCard = () => {
    const [ lastMonthTransactions, setLastMonthTransactions ] = useState([]);
    const [ currentMonthTransactions, setCurrentMonthTransactions ] = useState([]);
    const [ spendingComparison, setSpendingComparison ] = useState([]);
    
    useEffect(() => {
        const getTx = async () => {
            const currentMonth = new Date().getMonth();
            const lastMonth = (currentMonth + 11) % 12;
            const lastMonthtransactions = await getTransactions('vm', lastMonth);
            const currentMonthTransactions = await getTransactions('vm', currentMonth);
            setLastMonthTransactions(lastMonthtransactions);
            setCurrentMonthTransactions(currentMonthTransactions);
        };

        getTx();
    }, []);

    useEffect(() => {
        // Housing & Bills, Groceries, Transport, Shopping, Eating Out, Health & Fitness, ? Entertainment
        const categoriesToCompare = new Set(['Housing & Bills', 'Transport', 'Eating Out', 'Shopping', 'Groceries', 'Health & Fitness']);

        const lastMonthCategoryToSpending = {};
        const currentMonthCategoryToSpending = {};
        for (let category of categoriesToCompare) {
            lastMonthCategoryToSpending[category] = 0;
            currentMonthCategoryToSpending[category] = 0;
        };

        for (let tx of lastMonthTransactions) {
            if (categoriesToCompare.has(tx.category)) {
                lastMonthCategoryToSpending[tx.category] += Math.abs(tx.amount);
            };
        };

        for (let tx of currentMonthTransactions) {
            if (categoriesToCompare.has(tx.category)) {
                currentMonthCategoryToSpending[tx.category] += Math.abs(tx.amount);
            };
        };

        const percentChange = (currentMonthAmount, lastMonthAmount) => ((currentMonthAmount - lastMonthAmount) * 100) / lastMonthAmount;
        const res = [];
        for (let category of categoriesToCompare) {
            const currentMonthAmount = currentMonthCategoryToSpending[category];
            const lastMonthAmount = lastMonthCategoryToSpending[category];

            if (currentMonthAmount <= 0 || lastMonthAmount <= 0) {
                res.push({ 'category': category, 'difference': null });
            }
            else if (currentMonthAmount === lastMonthAmount) {
                 res.push({ 'category': category, 'difference': 0 });
            }
            else {
                const change = percentChange(currentMonthAmount, lastMonthAmount);
                res.push({ 'category': category, 'difference': change });
            };
        };

        console.log(res);
        setSpendingComparison(res);

    }, [currentMonthTransactions]);

    return (
        <div className='grid grid-rows-2 grid-flow-col gap-4 gap-x-20 p-5 rounded-lg bg-[#1a1818] shadow-lg'>
            {spendingComparison.map((item, i) => (
                <div key={i} className='p-2 mb-2'>
                    <p>{item.category}</p>
                    {
                        item.difference === null ? <p>--</p> : 
                        <p>
                            {item.difference.toFixed(2)}%
                        </p>
                    }
                </div>
            ))}
        </div>
    );
};

export default SpendingComparisonCard;