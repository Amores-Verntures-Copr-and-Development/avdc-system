import React from "react";
interface Store {
  id: number;
  name: string;
  sales: number;
  growth: number;
}

interface StoreCardSalesProps {
  data: Store;
}

const StoreCardSales = ({ data }: StoreCardSalesProps) => {
  return (
    <>
      <div
        key={data.id}
        className="flex flex-col p-2 sm:p-4 border rounded-2xl shadow-sm border-gray-200 bg-white hover:shadow-md transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] sm:text-sm font-semibold text-gray-800">
            {data.name}
          </h2>
          <span className="text-[11px] text-gray-500">Today</span>
        </div>

        {/* Sales Value */}
        <div className="flex items-baseline gap-1 sm:gap-2 mb-1">
          <span className="text-xs sm:text-sm font-bold text-green-600">
            ₱{data.sales.toLocaleString()}
          </span>
          <span
            className={`text-xs font-medium ${
              data.growth >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {data.growth >= 0 ? `+${data.growth}%` : `${data.growth}%`}
          </span>
        </div>

        {/* Comparison */}
        <p className="text-xs text-gray-500">vs yesterday</p>
      </div>
    </>
  );
};

export default StoreCardSales;
