import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Legend, Tooltip } from 'recharts';
import React, { useState, useEffect } from 'react';
import { getTransactions } from '../db/db.js';
import { CATEGORIES } from '../utils/constants/constants';
import { useNavigate } from 'react-router-dom';

const toRemove = new Set(['Income', 'Transfer', 'Finance & Fees'])
const FILTERED_CATEGORIES = CATEGORIES.filter(category => !toRemove.has(category));
const CATEGORY_COLORS = {
  "Groceries": "#4caf50CC",        // green
  "Housing & Bills": "#ff9800CC",  // orange
  "Finance & Fees": "#9c27b0CC",   // purple
  "Transport": "#2196f3CC",        // blue
  "Income": "#009688CC",           // teal
  "Shopping": "#e91e63CC",         // pink
  "Eating Out": "#ff5722CC",       // deep orange
  "Entertainment": "#673ab7CC",    // deep purple
  "Health & Fitness": "#f44336CC", // red
  "Transfer": "#607d8bCC",         // blue grey
  "Other / Misc": "#9e9e9eCC"      // grey
};

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

async function saveData ({ type, selectedMonth, retrievalRange, start, end }, setSpendingPerCategory, setCategoryToPercentage) {
	
	const data = await getTransactions({ rangeType: type, selectedMonth: selectedMonth, numRetrieved: retrievalRange, customStart: start, customEnd: end })
	// console.log(type, start, end, data);
	const categories = {};
	
	for (let category of FILTERED_CATEGORIES) {
		categories[category] = 0;
	};

	for (let row of data) {
		if (categories.hasOwnProperty(row['category'])) {
			categories[row['category']] = categories[row['category']] + row['amount']
		}
	}

	// Remove categories with total = 0
	for (let category in categories) {
		if (categories[category] === 0) {
			delete categories[category];
		}
	}

	const formatted = [];
	for (let [key, value] of Object.entries(categories)) {
		formatted.push({
			"category": key,
			"amount": Math.abs(value)
		});
	};

	setSpendingPerCategory(formatted);

	let categoriesTotal = 0;
	for (let obj of formatted) {
		categoriesTotal += obj.amount;
	};
	const res = {};
	for (let obj of formatted) {
		res[obj.category] = (obj.amount * 100) / categoriesTotal;
	}

	setCategoryToPercentage(res);
};

export default function CategoryPieChart({ range }) {
    const [ spendingPerCategory, setSpendingPerCategory ] = useState([]);
	const [ categoryToPercentage, setCategoryToPercentage ] = useState({});
	const navigate = useNavigate();

    // useEffect(() => {
    //     saveData({ type: "a" }, setSpendingPerCategory, setCategoryToPercentage);
    // }, []);

	useEffect(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		let kwargs = {};

		switch (range) {
			case "Past Week":
				const lastWeek = new Date(today);
				lastWeek.setDate(lastWeek.getDate() - 7);
				kwargs = { type: "custom", selectedMonth: null, numRetrieved: null, start: lastWeek, end: today };
				break;
			case "Past Month":
				const lastMonth = new Date(today);
				lastMonth.setMonth(lastMonth.getMonth() - 1);
				kwargs = { type: "custom", selectedMonth: null, numRetrieved: null, start: lastMonth, end: today };
				break;
			case "Past 3 Months":
				const last3Months = new Date(today);
				last3Months.setMonth(last3Months.getMonth() - 3);
				kwargs = { type: "custom", selectedMonth: null, numRetrieved: null, start: last3Months, end: today };
				break;
			case "Past Year":
				kwargs = { type: "y" };
				break;
			case "All Time":
				kwargs = { type: "a" };
				break;
		};

		saveData(kwargs, setSpendingPerCategory, setCategoryToPercentage);
	}, [range]);

	

    return (
		// <div style={{ width: 1000, height: 800 }}>
		<div className="
			w-full h-[350px] xl:h-[400px] 2xl:h-[400px] p-2
			rounded-lg bg-[#1a1818] shadow-lg
		">
			{spendingPerCategory.length > 0 ? (
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							// activeShape={renderActiveShape}
							data={spendingPerCategory}
							cx="50%"
							cy="50%"
							innerRadius="40%"
							outerRadius="70%"
							fill="#999"
							dataKey="amount"
							nameKey="category"
							label={({ name }) => {
								if (categoryToPercentage[name] > 0) {
									return `${categoryToPercentage[name].toFixed(2)}%`
								}
							}}
						>
							{spendingPerCategory.map((entry, index) => (
								<Cell key={`cell-${entry.category}`} fill={CATEGORY_COLORS[entry.category]} />
							))}
						</Pie>
						<Tooltip content={<CustomTooltip />} />
						<Legend />
					</PieChart>
				</ResponsiveContainer>
			) : (
				<div className='flex h-full w-full justify-center items-center'>
					<div>
						No transactions found
					</div>
				</div>
	
			)}
			
		</div>
        
    );
}
