import React, { useState, useEffect, useRef } from 'react';
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
import { useNavigate } from 'react-router-dom';

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
const NUM_TRANSACTIONS = 7;

const MostRecentTransactions = () => {
    const [ recentTransactions, setRecentTransactions ] = useState([]);
    const [ headers, setHeaders ] = useState([]);
    const gridRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        const getRecentTransactions = async () => {
            const tx = await getTransactions({ rangeType:'latest-n', numRetrieved:NUM_TRANSACTIONS });
            setRecentTransactions(tx);
        };

        getRecentTransactions();
    }, []);

    

    return (
        <div className='
                h-[610px] shadow-lg sm:h-[746px] rounded-lg bg-[#1a1818] cursor-pointer
            '
            onClick={() => navigate('/transactions')}
        >
            {recentTransactions.length > 0 ? (
                <div className="h-full p-3 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-y-8 p-3">
                        {recentTransactions.map((tx, i) => {
                            const Icon = CATEGORY_TO_ICON[tx.category] || OtherMisc;
                            return (
                                <div
                                    key={i}
                                    className="grid grid-cols-[auto_1fr_auto] gap-x-3 items-center p-3 rounded-2xl shadow"
                                >
                                    {/* Icon spanning two rows */}
                                    {/* <img
                                        src="/placeholder-icon.png"
                                        alt="icon"
                                        className="row-span-2 w-10 h-10 object-contain"
                                    /> */}
                                    
                                    <Icon className="row-span-2 w-11 h-11 p-1 bg-stone-300 rounded-xl text-gray-800" aria-label={'Icon'} />
                                    {/* <GroceriesIcon /> */}

                                    {/* First row: Description + Amount */}
                                    <p className="font-medium">{tx.description}</p>
                                    <p className="text-right font-semibold">{tx.amount}</p>

                                    {/* Second row: Category + Date */}
                                    <p className="text-sm text-gray-500">{tx.category}</p>
                                    <p className="text-right text-sm text-gray-500">{tx.date}</p>
                                </div>
                            )
                            
                        })}
                    </div>
                </div>
            ) : (
                <div className='flex h-full justify-center items-center'>
                    <div> No transactions found </div>
                </div>                
            )}
        </div>
        
    );
};

export default MostRecentTransactions;