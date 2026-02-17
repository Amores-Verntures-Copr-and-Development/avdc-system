import { formatPeso } from "@/utils/formatPeso";
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

interface ChartData {
  name: string;
  value: number;
}
// ✅ Example mock monthly sales data

interface ChartProps {
  data?: ChartData[];
  tooltipLabel?: string;
}
const formaToPeso = (value: number) => {
  if (value >= 1000) return `₱${(value / 1000).toFixed(1)}k`;
  return `₱${value.toFixed(0)}`;
};
const Chart = ({ data, tooltipLabel }: ChartProps) => {
  console.log({ data });
  return (
    <div className="w-full h-full flex flex-col">
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
          <YAxis tickFormatter={formaToPeso} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [
              `${formatPeso(value)}`,
              tooltipLabel || "Sales",
            ]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#e63389" // Tailwind green-500
            fill="#e081c5" // Tailwind green-100
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
