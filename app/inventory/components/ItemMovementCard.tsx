import { DisplayInventoryMovementDto } from "@/dtos/inventory.dto";
import React from "react";

interface ItemMovementCardProps {
  data: DisplayInventoryMovementDto;
  index: number;
}
const ItemMovementCard = ({ data, index }: ItemMovementCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-1.5 hover:bg-gray-50 transition-colors text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">{index + 1}</span>
          {data.itemMovementType === "in" ? (
            <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded-full font-medium">
              {data.itemMovementType}
            </span>
          ) : data.itemMovementType === "out" ? (
            <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded-full font-medium">
              {data.itemMovementType}
            </span>
          ) : (
            <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded-full font-medium">
              {data.itemMovementType}
            </span>
          )}
          <span className="text-gray-600 truncate max-w-[100px]">
            {data.itemMovementRemarks}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {data.itemMovementType === "in" ? (
            <span className="text-green-600 font-bold text-sm">
              {data.itemMovementType === "in" ? "+" : "-"}{" "}
              {data.itemMovementQuantity}
            </span>
          ) : (
            <span className="text-red-600 font-bold text-sm">
              {data.itemMovementType === "out" ? "+" : "-"}{" "}
              {data.itemMovementQuantity}
            </span>
          )}
          <span className="text-gray-400">qty</span>
        </div>
      </div>
      <div className="text-[10px] text-gray-400 mt-0.5">Jan 20, 2025</div>
    </div>
  );
};

export default ItemMovementCard;
