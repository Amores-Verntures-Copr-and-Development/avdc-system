import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ✅ Example mock monthly sales data
const data = [
  { name: "Jan", sales: 12500 },
  { name: "Feb", sales: 9800 },
  { name: "Mar", sales: 14200 },
  { name: "Apr", sales: 15800 },
  { name: "May", sales: 17600 },
  { name: "Jun", sales: 16400 },
  { name: "Jul", sales: 18900 },
  { name: "Aug", sales: 17200 },
  { name: "Sep", sales: 15100 },
  { name: "Oct", sales: 19400 },
  { name: "Nov", sales: 21200 },
  { name: "Dec", sales: 23800 },
];

const Chart = () => {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: -10,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [
              `₱${value.toLocaleString()}`,
              "Sales",
            ]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#10b981" // Tailwind green-500
            fill="#d1fae5" // Tailwind green-100
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
