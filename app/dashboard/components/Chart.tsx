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
  DotProps,
} from "recharts";

interface ChartData {
  name: string;
  value: number;
}

interface ChartProps {
  data?: ChartData[];
  tooltipLabel?: string;
}

const formatToPeso = (value: number) => {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `₱${(value / 1000).toFixed(1)}k`;
  return `₱${value.toFixed(0)}`;
};

const Chart = ({ data = [], tooltipLabel = "Sales" }: ChartProps) => {
  return (
    <div className="h-full w-full rounded-2xl bg-white">
      {/* debounce avoids re-measuring/re-rendering on every frame of a
          layout-affecting transition nearby (e.g. the sidebar collapsing) */}
      <ResponsiveContainer width="100%" height="100%" debounce={150}>
        <AreaChart
          data={data}
          className="font-semibold"
          margin={{
            top: 24,
            right: 28,
            left: -6,
            bottom: 8,
          }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e63389" stopOpacity={0.35} />
              <stop offset="55%" stopColor="#e63389" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#e63389" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#e5e7eb"
            strokeDasharray="4 4"
            vertical={true}
          />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            dy={8}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={formatToPeso}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            width={58}
          />

          <Tooltip
            cursor={{
              stroke: "#e63389",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
            formatter={(value: number) => [formatPeso(value), tooltipLabel]}
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.96)",
              border: "1px solid #f1f5f9",
              borderRadius: "14px",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
              padding: "10px 12px",
            }}
            labelStyle={{
              color: "#475569",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 4,
            }}
            itemStyle={{
              color: "#0f172a",
              fontSize: 13,
              fontWeight: 700,
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#e63389"
            fill="url(#salesGradient)"
            strokeWidth={3}
            activeDot={{
              r: 7,
              stroke: "#ffffff",
              strokeWidth: 3,
              fill: "#e63389",
            }}
            dot={{
              r: 3,
              stroke: "#ffffff",
              strokeWidth: 2,
              fill: "#e63389",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
