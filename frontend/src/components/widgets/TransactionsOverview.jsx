import React, { useState, useEffect } from 'react';
import { getTransactions } from '../../db/db.js';
import ChevronRight from '../../assets/icons/chevron-right-svgrepo-com.svg?react';
import ChevronLeft from '../../assets/icons/chevron-left-svgrepo-com.svg?react';

// #242424 dark theme

const TransactionsOverviewCard = () => {
    const [ transactions, setTransactions ] = useState([]);
    const [ totalIncome, setTotalIncome ] = useState(0);
    const [ totalExpenses, setTotalExpenses ] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0)
    const options = ["Past Week", "Past Month", "Past 3 Months", "Past Year"];
    const [selected, setSelected] = useState(options[0]);

    const handleChange = (e) => {
        setSelected(e.target.value)
    };

    useEffect(() => {
        const getTx = async () => {
            const transactions = await getTransactions({rangeType: 'y'});
            setTransactions(transactions);
        };

        getTx();
    }, []);

    useEffect(() => {
        if (!transactions) return;

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

    useEffect(() => {
        const updateTx = async () => {
            let transactions;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (selected) {
                case "Past Week":
                    const lastWeek = new Date(today);
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    transactions = await getTransactions({ rangeType: 'custom', customStart: lastWeek, customEnd: today });
                    break;
                case "Past Month":
                    const lastMonth = new Date(today);
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    transactions = await getTransactions({ rangeType: 'custom', customStart: lastMonth, customEnd: today });
                    break;
                case "Past 3 Months":
                    const last3Months = new Date(today);
                    last3Months.setMonth(last3Months.getMonth() - 3);
                    transactions = await getTransactions({ rangeType: 'custom', customStart: last3Months, customEnd: today });
                    break;
                case "Past Year":
                    transactions = await getTransactions({ rangeType: 'y' });
                    break;
            };
            
            setTransactions(transactions);
        };

        updateTx();
    }, [selected])

    const summaryItems = [
        {
            label: "Net",
            value: (totalIncome - totalExpenses).toFixed(2),
        },
        {
            label: "Total Expenses",
            value: totalExpenses.toFixed(2),
        },
        {
            label: "Total Income",
            value: totalIncome.toFixed(2),
        },
    ];

    const prev = () =>
        setCurrentIndex((i) => (i === 0 ? summaryItems.length - 1 : i - 1));
    const next = () =>
        setCurrentIndex((i) => (i === summaryItems.length - 1 ? 0 : i + 1));

    return (
        <div className="rounded-lg border border-neutral-300 dark:border-none dark:bg-dark h-full shadow-sm sm:h-[200px] p-5">
            <div className='flex flex-col'>
                <div className="flex items-center justify-between mb-5">
                    <span className="dark:text-gray-400 font-semibold text-md">
                        {summaryItems[currentIndex].label}
                    </span>

                    <select
                        value={selected}
                        onChange={handleChange}
                        className="p-1 cursor-pointer rounded-lg border border-neutral-200 hover:bg-neutral-200 dark:border-none dark:bg-dark dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        {options.map((opt, idx) => (
                            <option key={idx} value={opt} className='text-sm'>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
                
                <span className="dark:text-gray-200 font-semibold text-2xl mb-15">
                    {summaryItems[currentIndex].value}
                </span>
                <div className='flex justify-between'>
                    <span className='flex gap-x-1 text-sm cursor-pointer' onClick={prev}>
                        <ChevronLeft className='relative top-[6px] h-3 w-3' />
                        <p>Previous</p>
                    </span>
                    
                    {/* Pagination Dots */}
                    <div className="flex mt-2 space-x-2">
                        {summaryItems.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={
                                    `w-3 h-3 cursor-pointer rounded-full transition-colors focus:outline-none 
                                    ${idx === currentIndex ? "bg-gray-600 dark:bg-gray-200" : "bg-gray-200 dark:bg-gray-600"}`
                                }
                            />
                        ))}
                    </div>

                    <span className='flex gap-x-1 text-sm cursor-pointer' onClick={next}>
                        <p>
                            Next
                        </p>
                        <ChevronRight className='relative top-[6px] h-3 w-3'/>
                    </span>
                </div>
                
            </div>
        </div>
    );
};

export default TransactionsOverviewCard;