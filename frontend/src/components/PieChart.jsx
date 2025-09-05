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



export default function CategoryPieChart() {
    const [ spendingPerCategory, setSpendingPerCategory ] = useState([]);
	const [ categoryToPercentage, setCategoryToPercentage ] = useState({});
	const navigate = useNavigate();

    useEffect(() => {
      const saveData = async () => {
			const data = await getTransactions('a');
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

        saveData();
        
    }, []);

    return (
		// <div style={{ width: 1000, height: 800 }}>
		<div className="
				w-full h-[350px] xl:h-[400px] 2xl:h-[400px] p-2
				rounded-lg bg-[#1a1818] shadow-lg
			">
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
		</div>
        
    );
}
