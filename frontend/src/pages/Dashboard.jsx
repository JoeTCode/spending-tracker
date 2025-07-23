import { NavBar, AreaFillChart, StackedBarChart } from '../components';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState, useEffect } from 'react';
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
    const [ vmTransactions, setVmTransactions ] = useState([]);;
    const [ offset, setOffset ] = useState(null);
    const [ totalExpenses, setTotalExpenses ] = useState(0);
    const [ totalIncome, setTotalIncome ] = useState(0);
    const  [net, setNet ] = useState(0);
    const [ dataRetrievalRange, setDataRetrievalRange]  = useState('vm');
    const thisMonth = new Date();
    const [ selectedMonth, setSelectedMonth ] = useState(thisMonth.getMonth());
    const [ selectedYear, setSelectedYear ] = useState(thisMonth.getFullYear());

    useEffect(() => {
        const retrieveData = async () => {
            const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
            const data = await getTransactions(token, dataRetrievalRange, selectedMonth);
            setVmTransactions(data);
            console.log(data)
            setOffset(gradientOffset(data))
        };

        retrieveData();
    
    }, [selectedMonth]);

    useEffect(() => {
        let expenses = 0;
        let profit = 0;
        setTotalExpenses(() => {
            for (let tx of vmTransactions) {
                if (tx.amount < 0) {
                    expenses += tx.amount;
                }  
            }
            return expenses;
        })
        setTotalIncome(() => {
            for (let tx of vmTransactions) {
                if (tx.amount > 0) {
                    profit += tx.amount;
                }  
            }
            return profit;
        })
        setNet(() => {return (expenses + profit).toFixed(2)})
    }, [vmTransactions, selectedMonth])

    return (
        <>
            <NavBar />
            <h1>Dashboard</h1>
            
            <AreaFillChart transactions={vmTransactions} offset={offset}  />
            
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
                    {MONTHS[monthIdx]} {year}
                </div>
                Total Expenses: {totalExpenses} <br></br>
                Total Income: {totalIncome} <br></br>
                Net: {net}
            </div>
            
            <StackedBarChart transactions={vmTransactions}/>
        </>
    )
}

export default Dashboard