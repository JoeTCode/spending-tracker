import { NavBar } from '../components';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getTransactions } from '../api/transactions';

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

const Dashboard = () => {
    const { getAccessTokenSilently } = useAuth0();

    const [ transactions, setTransactions ] = useState([]);;
    const [ offset, setOffset ] = useState(null);

    useEffect(() => {
        const retrieveData = async () => {
            const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            const data = await getTransactions(token, 'd');
            const tx = data.transactions
            const filtered = tx.map(({ date, ...rest }) => ({
                ...rest,
                date: date.split('T')[0]
            }))
            setTransactions(filtered);
            console.log(filtered)
            setOffset(gradientOffset(filtered))
        };

        retrieveData();
    
    }, []);

    return (
        <>
            <NavBar />
            <h1>Dashboard</h1>
            <ResponsiveContainer width={1000} height={600}>
                <AreaChart
                    width={500}
                    height={400}
                    data={transactions}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={offset} stopColor="green" stopOpacity={1} />
                            <stop offset={offset} stopColor="red" stopOpacity={1} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="amount" stroke="#000" fill="url(#splitColor)" />
                </AreaChart>
            </ResponsiveContainer>
        </>
    )
}

export default Dashboard