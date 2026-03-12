import { Request } from "@/types/request";
import { StoreInterface } from "@/types/stores";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

import React from "react";
interface PendingRequest extends Request, StoreInterface {
  requestItemsCount: number;
}
interface StoreRequestOrderProps {
  data: PendingRequest;
}

const StoreRequestOrder = ({ data }: StoreRequestOrderProps) => {
  const router = useRouter();
  return (
    <div
      className="p-2 border border-gray-200 rounded-lg shadow bg-white hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between gap-3"
      onClick={() => {
        router.push(`/requisitions/${data.requestNo}`);
      }}
    >
      {/* Part 1: Icon and Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <ShoppingBag className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-gray-900 truncate text-[8px] 2xl:text-xs block">
            {data.storeName}
          </span>
          <span className="text-[9px] 2xl:text-xs text-gray-600 block mt-0.5">
            Store
          </span>
        </div>
      </div>

      {/* Part 2: Request ID and Status */}
      <div className="flex flex-col items-center min-w-0 flex-1">
        <span className="text-[9px] 2xl:text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
          {data.requestNo}
        </span>
        <span className="text-[9px] 2xl:text-xs text-gray-600 mt-0.5">
          {data.requestStatus}
        </span>
      </div>

      {/* Part 3: Items and Date */}
      <div className="flex flex-col items-end min-w-0 flex-1">
        <span className="font-semibold text-gray-900 text-xs 2xl:text-sm">
          {data.requestItemsCount} items
        </span>
        <span className="text-[8px] 2xl:text-xs truncate text-gray-600 mt-0.5">
          {formatDateToWords(data.requestCreatedAt)}
        </span>
      </div>
    </div>
  );
};

export default StoreRequestOrder;
