import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTransactions } from '../db/db.js';
import React, { useState, useEffect } from 'react';
import { MONTHS } from '../utils/constants/constants';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="text-gray-500">
            {entry.name}: <span className="font-medium">{entry.value.toFixed(2)}</span>
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export default function IncomeLineChart({ selectedYear }) {
    const [ dataPerMonth, setDataPerMonth ] = useState([]);
    
    useEffect(() => {
        const saveData = async () => {
            const data = await getTransactions({ rangeType: 'y', selectedYear: selectedYear });
            
            const incomeMonthBuckets = [];
            const expenseMonthBuckets = [];
            // populate buckets with objects for each month of year
            for (let month of MONTHS) {
                incomeMonthBuckets.push({
                    month: month.substring(0, 3),
                    income: 0
                });
                expenseMonthBuckets.push({
                    month: month.substring(0, 3),
                    expense: 0
                });
            };

            for (let row of data) {
                if (row.amount > 0) {
                    const d = new Date(row.date);
                    const monthIdx = d.getMonth();
                    incomeMonthBuckets[monthIdx].income += row.amount;
                };
                if (row.amount < 0) {
                  const d = new Date(row.date);
                  const monthIdx = d.getMonth();
                  expenseMonthBuckets[monthIdx].expense += Math.abs(row.amount);
                };              
            };

            const dataPerMonth = [];
            for (let i = 0; i < incomeMonthBuckets.length; i ++) {
                dataPerMonth.push({ 
                  month: incomeMonthBuckets[i].month,
                  income: incomeMonthBuckets[i].income,
                  expense: expenseMonthBuckets[i].expense
                });
            };

            setDataPerMonth(dataPerMonth);
        };

        saveData();
        
    }, [selectedYear]);

    return (
        <div className="
        w-full h-[350px] xl:h-[400px] p-5 pt-10
        rounded-lg bg-[#1a1818] shadow-lg
        ">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={dataPerMonth}
                    margin={{
						top: 5,
						right: 30,
						left: 20,
						bottom: 5,
                    }}
                >
                    {/* <CartesianGrid strokeDasharray="2 5" /> */}
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => value.toFixed(2)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#8884d8" dot={() => {}} />
                    <Line type="monotone" dataKey="expense" stroke="#DA5958" dot={() => {}} />
                    {/* <Line type="monotone" dataKey="uv" stroke="#82ca9d" /> */}
                </LineChart>
            </ResponsiveContainer>
        </div>
        
    );
}
