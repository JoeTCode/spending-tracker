import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Legend, Tooltip } from 'recharts';
import React, { useState, useEffect } from 'react';
import { getTransactions } from '../db/db.js';
import { CATEGORIES } from '../utils/constants/constants';

const toRemove = new Set(['Income', 'Transfer'])
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
const renderActiveShape = ({
	cx,
	cy,
	midAngle,
	innerRadius,
	outerRadius,
	startAngle,
	endAngle,
	fill,
	payload,
	percent,
	value,
}) => {
	const RADIAN = Math.PI / 180;
	const sin = Math.sin(-RADIAN * (midAngle ?? 1));
	const cos = Math.cos(-RADIAN * (midAngle ?? 1));
	const sx = (cx ?? 0) + ((outerRadius ?? 0) + 10) * cos;
	const sy = (cy ?? 0) + ((outerRadius ?? 0) + 10) * sin;
	const mx = (cx ?? 0) + ((outerRadius ?? 0) + 30) * cos;
	const my = (cy ?? 0) + ((outerRadius ?? 0) + 30) * sin;
	const ex = mx + (cos >= 0 ? 1 : -1) * 22;
	const ey = my;
	const textAnchor = cos >= 0 ? 'start' : 'end';

	return (
		<g>
		<text x={cx} y={cy} dy={8} fontSize={24} fontWeight={"bold"} textAnchor="middle" fill={fill}>
			{payload.category}
		</text>
		<Sector
			cx={cx}
			cy={cy}
			innerRadius={innerRadius}
			outerRadius={outerRadius}
			startAngle={startAngle}
			endAngle={endAngle}
			fill={fill}
		/>
		<Sector
			cx={cx}
			cy={cy}
			startAngle={startAngle}
			endAngle={endAngle}
			innerRadius={(outerRadius ?? 0) + 6}
			outerRadius={(outerRadius ?? 0) + 10}
			fill={fill}
		/>
		<path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
		<circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
		<text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} fontSize={18} textAnchor={textAnchor} fill={CATEGORY_COLORS[payload.category]}>{`Amount: ${value.toFixed(2)}`}</text>
		<text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
			{`(${((percent ?? 1) * 100).toFixed(2)}%)`}
		</text>
		</g>
	);
};

export default function CategoryPieChart() {
    const [ spendingPerCategory, setSpendingPerCategory ] = useState([]);
	const [ categoryToPercentage, setCategoryToPercentage ] = useState({});

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
								return `${name} (${categoryToPercentage[name].toFixed(2)}%)`
							}
						}}
					>
						{spendingPerCategory.map((entry, index) => (
							<Cell key={`cell-${entry.category}`} fill={CATEGORY_COLORS[entry.category]} />
						))}
					</Pie>
					<Tooltip 
						formatter={(value) => value.toFixed(2)} 
					/>
					{/* <Legend /> */}
				</PieChart>
        	</ResponsiveContainer>
		</div>
        
    );
}
