import { formatPeso } from "@/utils/formatPeso";
import React from "react";

interface PaymentMethodTotal {
  payMetName: string;
  totalAmount: number;
}

interface PaymentMethodBreakdownProps {
  data: PaymentMethodTotal[];
}

const BAR_COLORS = [
  "bg-primary-1",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
];

const PaymentMethodBreakdown = ({ data }: PaymentMethodBreakdownProps) => {
  const total = data.reduce((sum, d) => sum + Number(d.totalAmount), 0);

  if (data.length === 0 || total === 0) {
    return (
      <p className="py-6 text-center text-xs text-gray-400">
        No payment data yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((method, index) => {
        const pct = total > 0 ? (Number(method.totalAmount) / total) * 100 : 0;

        return (
          <div key={method.payMetName} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">
                {method.payMetName}
              </span>
              <span className="font-semibold text-gray-900">
                {formatPeso(method.totalAmount)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">
              {pct.toFixed(1)}% of total sales
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentMethodBreakdown;
