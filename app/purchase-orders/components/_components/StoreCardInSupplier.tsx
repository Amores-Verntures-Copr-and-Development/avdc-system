import React from "react";
import { StoreSupplierDetails } from "../ApprovedPOView";

interface StoreCardInSupplierProps {
  data: StoreSupplierDetails;
}

const StoreCardInSupplier = ({ data }: StoreCardInSupplierProps) => {
  return (
    <div className="flex flex-col p-3 border border-gray-300 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer w-64">
      {/* Store Header */}
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-gray-800">{data.storeName}</span>
        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {data.items.length} items
        </span>
      </div>

      {/* Minimal Item Details */}
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Pending:</span>
          <span className="font-medium">
            {
              data.items.filter((item) => item.poItemStatus === "pending")
                .length
            }
          </span>
        </div>
        <div className="flex justify-between">
          <span>Delivered:</span>
          <span className="font-medium">
            {" "}
            {
              data.items.filter((item) => item.poItemStatus === "delivered")
                .length
            }
          </span>
        </div>
        <div className="flex justify-between">
          <span>Received:</span>
          <span className="font-medium">
            {" "}
            {
              data.items.filter((item) => item.poItemStatus === "received")
                .length
            }
          </span>
        </div>
      </div>

      {/* Quick Status Summary */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-gray-500">Last updated: 2h ago</span>
        </div>
      </div>
    </div>
  );
};

export default StoreCardInSupplier;
