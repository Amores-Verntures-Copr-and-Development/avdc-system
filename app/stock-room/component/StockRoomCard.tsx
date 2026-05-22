import { StockRoom } from "@/types/stockRoom";
import { Package, MapPin, ChevronRight } from "lucide-react";
import React from "react";

interface StockRoomCardProps {
  data: StockRoom & { totalItems?: number };
  onClick: (row: StockRoom) => void;
}

const StockRoomCard = ({ data, onClick }: StockRoomCardProps) => {
  const modifyTotal = () => {
    const total = data.totalItems || 0;

    if (total >= 1_000_000) {
      return (total / 1_000_000).toFixed(1).replace(".0", "") + "M";
    }

    if (total >= 1_000) {
      return (total / 1_000).toFixed(1).replace(".0", "") + "k";
    }

    return total.toString();
  };
  return (
    <div
      onClick={() => {
        onClick(data);
      }}
      className="group flex items-center p-1.5 xl:p-3 bg-white rounded-lg w-full shadow-sm border border-gray-100 gap-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer"
    >
      {/* Icon/Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
        <Package className="w-3 h-3 lg:w-6 lg:h-6 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 flex-col md:flex xl:flex-col min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xs xl:text-base font-semibold text-gray-900  group-hover:text-blue-600">
            {data.stockRoomName}
          </h1>
          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[8px] xl:text-xs font-medium rounded-full">
            Active
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 ">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{data.stockRoomLocation}</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            <span>{modifyTotal()} items</span>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default StockRoomCard;
