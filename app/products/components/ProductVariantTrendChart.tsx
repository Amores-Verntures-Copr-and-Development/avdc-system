import { SalesTrendByProductVariant } from "@/types/sales";
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

export type TrendGranularity = "days" | "weeks" | "month";

interface ProductVariantTrendChartProps {
  data: SalesTrendByProductVariant[];
  granularity: TrendGranularity;
  onGranularityChange: (granularity: TrendGranularity) => void;
  isLoading?: boolean;
}

const GRANULARITY_OPTIONS: { value: TrendGranularity; label: string }[] = [
  { value: "days", label: "Day" },
  { value: "weeks", label: "Week" },
  { value: "month", label: "Month" },
];

// Weeks come back as MySQL YEARWEEK(x,1) - an integer like 202409 (year +
// 2-digit week). Months come back as a plain "YYYY-MM" string (DATE_FORMAT).
// Days come back as a DATE, which JSON-serializes to an ISO datetime string.
function formatPeriodLabel(
  period: string | number,
  granularity: TrendGranularity,
): string {
  if (granularity === "weeks") {
    const raw = String(period);
    const year = raw.slice(0, 4);
    const week = Number(raw.slice(4));
    return `Wk ${week} '${year.slice(2)}`;
  }

  if (granularity === "month") {
    const [year, month] = String(period).split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }

  const date = new Date(period);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatQty(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

const EMPTY_STATE = (
  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
    No sales data for this period
  </div>
);

const ProductVariantTrendChart = ({
  data,
  granularity,
  onGranularityChange,
  isLoading,
}: ProductVariantTrendChartProps) => {
  const chartData = data.map((row) => ({
    label: formatPeriodLabel(row.period, granularity),
    totalQtySold: Number(row.totalQtySold),
    totalSales: Number(row.totalSales),
  }));

  const hasData = !isLoading && chartData.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600">Sales Trend</p>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
          {GRANULARITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onGranularityChange(option.value)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                granularity === option.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-xl border border-gray-100 p-3">
          <p className="text-[10px] font-semibold uppercase text-gray-400">
            Quantity Sold
          </p>
          <div className="h-[160px] w-full">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%" debounce={150}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="qtyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatQty}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    width={30}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ stroke: "#2563eb", strokeWidth: 1, strokeDasharray: "4 4" }}
                    formatter={(value: number) => [value, "Qty Sold"]}
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.96)",
                      border: "1px solid #f1f5f9",
                      borderRadius: "12px",
                      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
                      padding: "8px 10px",
                    }}
                    labelStyle={{ color: "#475569", fontSize: 11, fontWeight: 600 }}
                    itemStyle={{ color: "#0f172a", fontSize: 12, fontWeight: 700 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalQtySold"
                    stroke="#2563eb"
                    fill="url(#qtyGradient)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#2563eb" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              EMPTY_STATE
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-gray-100 p-3">
          <p className="text-[10px] font-semibold uppercase text-gray-400">
            Total Sales
          </p>
          <div className="h-[160px] w-full">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%" debounce={150}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e63389" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e63389" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => formatPeso(value)}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    width={52}
                  />
                  <Tooltip
                    cursor={{ stroke: "#e63389", strokeWidth: 1, strokeDasharray: "4 4" }}
                    formatter={(value: number) => [formatPeso(value), "Total Sales"]}
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.96)",
                      border: "1px solid #f1f5f9",
                      borderRadius: "12px",
                      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
                      padding: "8px 10px",
                    }}
                    labelStyle={{ color: "#475569", fontSize: 11, fontWeight: 600 }}
                    itemStyle={{ color: "#0f172a", fontSize: 12, fontWeight: 700 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalSales"
                    stroke="#e63389"
                    fill="url(#salesTrendGradient)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#e63389" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              EMPTY_STATE
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantTrendChart;
