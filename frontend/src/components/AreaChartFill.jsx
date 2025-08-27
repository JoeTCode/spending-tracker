import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';
import { MONTHS, DAYS } from '../utils/constants/constants.js';
import { getTransactions } from '../api/transactions';

const AreaFillChart = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [ dataRetrievalRange, setDataRetrievalRange]  = useState('vm');
    const thisMonth = new Date();
    const [ selectedMonth, setSelectedMonth ] = useState(thisMonth.getMonth());
    const [ selectedYear, setSelectedYear ] = useState(thisMonth.getFullYear());
    const [ transactions, setTransactions ] = useState([]);;
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
                const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
                const data = await getTransactions(token, dataRetrievalRange, selectedMonth);
                
                // sum all transactions that occur on the same day
                const dates = {}
                const formatted = []
                for (const row of data) {
                    const dateIdx = new Date(row.date).getDate();
                    if (!dates[dateIdx]) {
                        dates[dateIdx] = row.amount;
                        formatted.push(row);
                    } else {
                        dates[dateIdx] += row.amount;
                    };
                }

                formatted.map((object) => {
                    const date = new Date(object.date).getDate()
                    object.amount = dates[date];
                })

                // Format date from dd/mm/yyyy to e.g. Jan 1
                for (const row of formatted) {
                    const date = new Date(row.date);
                    const day = DAYS[date.getDay()];
                    row.date = day.substring(0, 3) + ' ' + date.getDate();
                };

                setTransactions(formatted);
                setOffset(gradientOffset(formatted))
            };
    
            retrieveData();
        
        }, [selectedMonth]);
    
    // Compute data for transaction breakdown widget
    useEffect(() => {
        let expenses = 0;
        let profit = 0;
        setTotalExpenses(() => {
            for (let tx of transactions) {
                if (tx.amount < 0) {
                    expenses += tx.amount;
                }  
            }
            return expenses;
        })
        setTotalIncome(() => {
            for (let tx of transactions) {
                if (tx.amount > 0) {
                    profit += tx.amount;
                }  
            }
            return profit;
        })
        setNet(() => {return (expenses + profit)})
    }, [transactions, selectedMonth])

    return ( 
        <>
            <div style={{ width: 900, height: 600 }}>
                <ResponsiveContainer>
                    <AreaChart
                        data={transactions}
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