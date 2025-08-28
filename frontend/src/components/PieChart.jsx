import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Legend } from 'recharts';
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getTransactions } from '../api/transactions';
import { CATEGORIES } from '../utils/constants/constants';

const toRemove = new Set(['Income', 'Transfer'])
const FILTERED_CATEGORIES = CATEGORIES.filter(category => !toRemove.has(category));
const CATEGORY_COLORS = {
  "Groceries": "#4caf50",       // green
  "Housing & Bills": "#ff9800", // orange
  "Finance & Fees": "#9c27b0",  // purple
  "Transport": "#2196f3",       // blue
  "Income": "#009688",          // teal
  "Shopping": "#e91e63",        // pink
  "Eating Out": "#ff5722",      // deep orange
  "Entertainment": "#673ab7",   // deep purple
  "Health & Fitness": "#f44336",// red
  "Transfer": "#607d8b",        // blue grey
  "Other / Misc": "#9e9e9e"     // grey
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
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
      const saveData = async () => {
			const token = await getAccessTokenSilently({ audience: "http://localhost:5000", scope: "read:current_user" });
			const data = await getTransactions(token, 'a');
			const categories = {};
			
			for (let category of FILTERED_CATEGORIES) {
				categories[category] = 0;
			};

			for (let row of data) {
				if (categories.hasOwnProperty(row['category'])) {
					categories[row['category']] = categories[row['category']] + row['amount']
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
        };

        saveData();
        
    }, []);

    return (
		<div style={{ width: 1000, height: 800 }}>
			<ResponsiveContainer>
				<PieChart>
					<Pie
					activeShape={renderActiveShape}
					data={spendingPerCategory}
					cx="50%"
					cy="50%"
					innerRadius={200}
					outerRadius={280}
					fill="#999"
					dataKey="amount"
					nameKey="category"
					>
						{spendingPerCategory.map((entry, index) => (
							<Cell key={`cell-${entry.category}`} fill={CATEGORY_COLORS[entry.category]} />
						))}
					</Pie>
					<Legend />
				</PieChart>
        	</ResponsiveContainer>
		</div>
        
    );
}
