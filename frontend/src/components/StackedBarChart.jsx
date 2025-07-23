import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MONTHS } from '../utils/constants/constants.js';
import { getTransactions } from '../api/transactions';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';

// function ToolTip({ children }) {
//     console.log(children);
//     return (
//         <></>
//     )
// }

const CustomTooltip = ({ active, payload, label }) => {
    const isVisible = active && payload && payload.length > 0;
    console.log(payload)
    return (
        <div className="custom-tooltip" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
        {isVisible && (
            <>
            <p className="label">{`${label} : ${payload[0].value}`}</p>
            <p className="desc">Anything you want can be displayed here.</p></>
        )}
        </div>
    );
};

const StackedBarChart = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [ transactions, setTransactions ] = useState([]);
    const thisMonth = new Date();
    const [ selectedMonth, setSelectedMonth ] = useState(thisMonth.getMonth());
    const [ totalExpenses, setTotalExpenses ] = useState(0);
    const [ totalIncome, setTotalIncome ] = useState(0);

    // Retrieve and format data
    useEffect(() => {
        const retrieveData = async () => {
            const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            const data = await getTransactions(token, 'y', selectedMonth);

            const dataByMonth = []
            for (let i = 0; i < 12; i++) {
                dataByMonth.push({
                    month: MONTHS[i].substring(0, 3),
                    income: 0,
                    expense: 0,
                    categories: []
                })
            };

            for (let row of data) {
                const date = new Date(row.date)
                const monthObj = dataByMonth[date.getMonth()];
                if (row.amount >= 0) {
                    monthObj.income += row.amount;
                    setTotalIncome(prev => prev + row.amount);
                } else {
                    monthObj.expense += Math.abs(row.amount)
                    setTotalExpenses(prev => prev + row.amount);
                };
            }

            setTransactions(dataByMonth);
        };

        retrieveData();
    
    }, []);   

    return ( 
        <>
            <ResponsiveContainer width={700} height={600}>
                <BarChart
                width={500}
                height={300}
                data={transactions}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
                >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                    trigger='click'
                    wrapperStyle={{ pointerEvents: "auto"}}
                    content={CustomTooltip}
                />
                <Legend />
                <Bar dataKey="income" stackId="a" fill="#3fad44ff" />
                <Bar dataKey="expense" stackId="a" fill="#b34f36ff" />
                </BarChart>
            </ResponsiveContainer>      
            <div>
                Total Expenses: {totalExpenses.toFixed(2)} <br></br>
                Total Income: {totalIncome.toFixed(2)} <br></br>
                Net: {(totalIncome + totalExpenses).toFixed(2)}
            </div>
        </>
     );
}
 
export default StackedBarChart;