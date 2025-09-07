import React, { useState, useEffect } from 'react';
import { getTransactions } from '../../db/db.js';
import GroceriesIcon from "../../assets/icons/groceries.svg?react";
import HousingAndBills from "../../assets/icons/housing-and-bills.svg?react";
import FinanceAndFees from "../../assets/icons/finance-and-fees.svg?react";
import Income from "../../assets/icons/income.svg?react";
import Shopping from "../../assets/icons/shopping.svg?react";
import EatingOut from "../../assets/icons/eating-out.svg?react";
import Entertainment from "../../assets/icons/entertainment.svg?react";
import HealthAndFitness from "../../assets/icons/health-and-fitness.svg?react";
import Transfer from "../../assets/icons/transfer.svg?react";
import OtherMisc from "../../assets/icons/other-misc.svg?react";
import Transport from "../../assets/icons/transport.svg?react";
import SmallArrowDown from "../../assets/icons/arrow-sm-down.svg?react";
import SmallArrowUp from "../../assets/icons/arrow-sm-up.svg?react";
import Hyphen from "../../assets/icons/hyphen.svg?react";

const CATEGORY_TO_ICON = {
    "Groceries": GroceriesIcon,
    "Housing & Bills": HousingAndBills,
    "Finance & Fees": FinanceAndFees,
    "Transport": Transport,
    "Income": Income,
    "Shopping": Shopping,
    "Eating Out": EatingOut,
    "Entertainment": Entertainment,
    "Health & Fitness": HealthAndFitness,
    "Transfer": Transfer,
    "Other / Misc": OtherMisc
};

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
                res.push({ 'category': category, 'difference': null, 'currentAmount': null });
            }
            else if (currentMonthAmount === lastMonthAmount) {
                 res.push({ 'category': category, 'difference': 0, 'currentAmount': currentMonthAmount });
            }
            else {
                const change = percentChange(currentMonthAmount, lastMonthAmount);
                res.push({ 'category': category, 'difference': change, 'currentAmount': currentMonthAmount });
            };
        };

        console.log(res);
        setSpendingComparison(res);

    }, [currentMonthTransactions]);

    return (
        <div className='grid grid-rows-3 grid-flow-col p-5 justify-center gap-x-20 sm:grid-rows-2 sm:gap-4 md:gap-x-40 lg:gap-x-60 xl:gap-x-100 rounded-lg bg-[#1a1818] shadow-lg'>
            {spendingComparison.map((item, i) => {
                const Icon = CATEGORY_TO_ICON[item.category] || OtherMisc;
                return (
                    <div key={i} className="grid sm:grid-cols-[auto_1fr] gap-x-3 items-center p-2 rounded-2xl shadow-lg mb-2">
                        <Icon className="row-span-3 w-14 h-14 p-1 bg-stone-300 rounded-xl text-gray-800" aria-label={'Icon'} />
                        <p className='text-xs text-gray-400'>{item.category}</p>
                        {item.currentAmount === null ?
                            <p className='text-lg font-bold text-gray-200'>--</p> :
                            <p className='text-lg font-bold text-gray-200'>{(item.currentAmount).toFixed(2)}</p>
                        }
                        
                        {item.difference === null ? 
                            <p className='text-xs text-gray-400'>--</p> :
                            item.difference === 0 ?
                            <div className='flex'>
                                <p className='text-xs text-gray-400 font-semibold'>
                                    {item.difference.toFixed(2)}%
                                </p>
                                <Hyphen className="w-5 h-5 text-gray-400" />
                            </div>
                             :
                            item.difference > 0 ?
                            <div className='flex items-center'>
                                <p className='text-xs text-green-600 font-semibold'>{item.difference.toFixed(2)}%</p>
                                <SmallArrowUp className="w-5 h-5 text-green-600" />
                            </div> :
                            <div className='flex'>
                                <p className='text-xs text-red-500 font-semibold'>{Math.abs(item.difference).toFixed(2)}%</p>
                                 <SmallArrowDown className="w-5 h-5 text-red-500" />
                            </div>
                        }
                    </div>
                )
            })}
        </div>
    );
};

export default SpendingComparisonCard;