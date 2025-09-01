import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';
import { MONTHS, DAYS } from '../utils/constants/constants.js';
// import { getTransactions } from '../api/transactions';
import { getTransactions } from '../db/db.js';

const AreaFillChart = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [ dataRetrievalRange, setDataRetrievalRange]  = useState('vm');
    const thisMonth = new Date();
    const [ selectedMonth, setSelectedMonth ] = useState(thisMonth.getMonth());
    const [ selectedYear, setSelectedYear ] = useState(thisMonth.getFullYear());
    const [ transactions, setTransactions ] = useState([]);
    const [ summedTransactions, setSummedTransactions ] = useState([]);
    const [ offset, setOffset ] = useState(null);
    const [ totalExpenses, setTotalExpenses ] = useState(0);
    const [ totalIncome, setTotalIncome ] = useState(0);
    const [ net, setNet ] = useState(0);

    // Calculate the stop points for each fill color
    const gradientOffset = (data) => {
        const dataMax = Math.max(...data.map((i) => i.amount));
        const dataMin = Math.min(...data.map((i) => i.amount));

        if (dataMax <= 0) {
            return 0;
        }
        if (dataMin >= 0) {
            return 1;
        }

        return dataMax / (dataMax - dataMin);
    };


    // Retrieve data
    useEffect(() => {
        const retrieveData = async () => {

            const data = await getTransactions(dataRetrievalRange, selectedMonth);

            // Aggregate transactions per day
            const dailyTotals = {};
            data.forEach(tx => {
            const dayKey = new Date(tx.date).toISOString().split("T")[0]; // YYYY-MM-DD
            if (!dailyTotals[dayKey]) dailyTotals[dayKey] = 0;
            dailyTotals[dayKey] += Number(tx.amount);
            });

            // Build formatted array
            const formatted = Object.entries(dailyTotals).map(([dateStr, amount]) => {
            const date = new Date(dateStr);
            const dayName = DAYS[date.getDay()].substring(0, 3);
            return {
                date: `${dayName} ${date.getDate()}`,
                amount,
            };
            });

            setSummedTransactions(formatted);
            setTransactions(data); // original raw data
            setOffset(gradientOffset(formatted));
        };

        retrieveData();
    }, [selectedMonth]);
    
    // Compute data for transaction breakdown widget
    useEffect(() => {
        let expenses = 0;
        let profit = 0;
        
        for (let tx of transactions) {
            console.log(tx);
            if (tx.amount < 0) {
                expenses += tx.amount;
            }  
        }
        setTotalExpenses(expenses);

        for (let tx of transactions) {
            if (tx.amount > 0) {
                console.log(tx);
                profit += tx.amount;
            }  
        }
        setTotalIncome(profit);

        setNet(expenses + profit)
    }, [transactions])

    return ( 
        <>
            <div className="w-full sm:h-[200px] md:h-[300px] xl:h-[400px] 2xl:h-[500px] p-2">
                <ResponsiveContainer>
                    <AreaChart
                        data={summedTransactions}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date"/>
                        <YAxis />
                        <Tooltip 
                            formatter={(value) => Number(value).toFixed(2)}
                        />
                        <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset={offset} stopColor="green" stopOpacity={1} />
                                <stop offset={offset} stopColor="red" stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="amount" stroke="#000" fill="url(#splitColor)" />
                    </AreaChart>
                </ResponsiveContainer>

                <button onClick={async () => {
                    setSelectedMonth(prev => (prev - 1 + 12) % 12) // wraps to 11 (Dec) if below 0 (Jan)
                }}>
                    Prev
                </button>
                <button onClick={async () => {
                    setSelectedMonth(prev => (prev + 1 + 12) % 12) // wraps to 11 (Dec) if below 0 (Jan)
                }}>
                    Next
                </button>

                <div>
                    <div>
                        {MONTHS[selectedMonth]} {selectedYear}
                    </div>
                    Total Expenses: {totalExpenses.toFixed(2)} <br></br>
                    Total Income: {totalIncome.toFixed(2)} <br></br>
                    Net: {net.toFixed(2)}
                </div>
            </div>
            
        </>
     );
}
 
export default AreaFillChart;