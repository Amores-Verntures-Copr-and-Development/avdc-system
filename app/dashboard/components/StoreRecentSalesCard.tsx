"use client";
import React from "react";
import { StoreRecentSales } from "../Owner/OwnerDashboard";
import { formatPeso } from "@/utils/formatPeso";
// adjust path

interface StoreRecentSalesCardProps {
  data: StoreRecentSales;
}

const StoreRecentSalesCard = ({ data }: StoreRecentSalesCardProps) => {
  return (
    <div
      key={data.storeId}
      className="flex flex-col p-2 sm:p-4 border rounded-2xl shadow-sm border-gray-200 bg-white hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[10px] sm:text-sm font-semibold text-gray-800">
          {data.storeName}
        </h2>
        <span className="text-[11px] text-gray-500">Today</span>
      </div>

      {/* Sales Value */}
      <div className="flex items-baseline gap-1 sm:gap-2 mb-1">
        <span className="text-xs sm:text-sm font-bold text-green-600">
          {formatPeso(data.salesTotalAmount)}
        </span>
        <span className="text-xs font-medium text-gray-500">
          {/* optional growth, you can pass this if available */}
        </span>
      </div>

      {/* Items Sold */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">Items Sold</p>
        <span className="text-xs font-medium text-gray-700">
          {data.itemQty}
        </span>
      </div>

      {/* Sale Number */}
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-gray-500">Sale No</p>
        <span className="text-xs font-medium text-gray-700">
          {data.salesNo}
        </span>
      </div>
    </div>
  );
};

export default StoreRecentSalesCard;
