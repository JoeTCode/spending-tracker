import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTransactions } from '../db/db.js';
import React, { useState, useEffect } from 'react';
import { MONTHS } from '../utils/constants/constants';

export default function IncomeLineChart() {
    const [ profitPerMonth, setProfitPerMonth ] = useState([]);

    useEffect(() => {
        const saveData = async () => {
            const data = await getTransactions('y');
            
            const monthBuckets = [];
            // populate buckets with objects for each month of year
            for (let month of MONTHS) {
                monthBuckets.push({
                    month: month.substring(0, 3),
                    income: 0
                });
            };

            for (let row of data) {
                if (row.amount > 0) {
                    const d = new Date(row.date);
                    const monthIdx = d.getMonth();
                    monthBuckets[monthIdx].income += row.amount;
                };                
            };

            // const formatted = [];
            // for (let [key, value] of Object.entries(categories)) {
            //     formatted.push({
            //         "category": key,
            //         "amount": Math.abs(value)
            //     });
            // };
            setProfitPerMonth(monthBuckets);
        };

        saveData();
        
    }, []);

    return (
        <div className="
        w-full h-[350px] xl:h-[400px] 2xl:h-[400px] p-5 pt-10
        rounded-lg bg-[#1a1818] shadow-lg
        ">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={profitPerMonth}
                    margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="2 5" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => value.toFixed(2)} />
                    <Tooltip formatter={(value) => value.toFixed(2)} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#8884d8" activeDot={{ r: 8 }} />
                    {/* <Line type="monotone" dataKey="uv" stroke="#82ca9d" /> */}
                </LineChart>
            </ResponsiveContainer>
        </div>
        
    );
}
