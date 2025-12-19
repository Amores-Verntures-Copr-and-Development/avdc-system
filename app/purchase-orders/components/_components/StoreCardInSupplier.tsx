import React from "react";
import { StoreSupplierDetails } from "../ApprovedPOView";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Store,
  Truck,
} from "lucide-react";

interface StoreCardInSupplierProps {
  data: StoreSupplierDetails;
  onClick?: (row: StoreSupplierDetails) => void;
}

const StoreCardInSupplier = ({ data, onClick }: StoreCardInSupplierProps) => {
  const pendingCount = data.items.filter(
    (item) => item.reqItemStatus === "pending"
  ).length;
  const deliveredCount = data.items.filter(
    (item) => item.reqItemStatus === "delivered"
  ).length;
  const receivedCount = data.items.filter(
    (item) => item.reqItemStatus === "received"
  ).length;
  const totalItems = data.items.length;
  const getStatusInfo = () => {
    if (pendingCount === totalItems) {
      return {
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        icon: AlertCircle,
        message: "All Pending",
      };
    } else if (receivedCount === totalItems) {
      return {
        color: "text-green-600",
        bg: "bg-green-50",
        icon: CheckCircle,
        message: "All Received",
      };
    } else if (pendingCount === 0) {
      return {
        color: "text-blue-600",
        bg: "bg-blue-50",
        icon: Truck,
        message: "In Progress",
      };
    } else {
      return {
        color: "text-orange-600",
        bg: "bg-orange-50",
        icon: Package,
        message: "Partially Fulfilled",
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  return (
    <div
      onClick={() => {
        if (onClick) {
          onClick(data);
        }
      }}
      className="group relative flex flex-col p-4 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer w-72"
    >
      {/* Store Header */}
      <div className="flex items-start justify-between mb-3 mt-1">
        <div className="flex items-center gap-2 flex-1">
          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <Store className="w-3 h-3 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-[9px] xl:text-sm leading-tight">
              {data.storeName}
            </h3>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
          <Package className="w-3 h-3" />
          {totalItems}
        </span>
      </div>

      {/* Status Badge */}
      <div
        className={`flex items-center gap-2 ${statusInfo.bg} ${statusInfo.color} px-3 py-2 rounded-lg mb-3`}
      >
        <StatusIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{statusInfo.message}</span>
      </div>

      {/* Item Status Breakdown */}
      <div className="space-y-1">
        {/* Pending */}
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {pendingCount}
          </span>
        </div>

        {/* Delivered */}
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Delivered</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {deliveredCount}
          </span>
        </div>

        {/* Received */}
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Received</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {receivedCount}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {"2h ago"}</span>
          </div>
          <span className="text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
};

export default StoreCardInSupplier;
