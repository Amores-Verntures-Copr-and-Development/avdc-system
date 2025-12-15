import React from "react";
import { Ellipsis, Minus, Plus } from "lucide-react";
import { OrderList } from "../PosPage";

interface OrderProductCardProps {
  data: OrderList;
  removeQuantityProductList: (data: OrderList) => void;
  addQuantity: (data: OrderList) => void;
}
const OrderProductCard = ({
  data,
  removeQuantityProductList,
  addQuantity,
}: OrderProductCardProps) => {
  return (
    <div className="flex justify-between items-center rounded-lg shadow-md p-3 bg-gray-100 hover:shadow-lg border border-gray-300 transition">
      {/* Left side: product info */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-800">
          {data.prodVarName}
        </span>
        <span className="text-xs font-semibold text-primary-600">
          {Number(data.prodVarPrice).toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP",
          })}
        </span>
      </div>

      {/* Right side: actions */}
      <div className="flex flex-col items-end space-y-1">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-primary-600">
            {(Number(data.prodVarPrice) * Number(data.quantity)).toLocaleString(
              "en-PH",
              {
                style: "currency",
                currency: "PHP",
              }
            )}
          </span>
          <Ellipsis
            size={18}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 hover:bg-primary-100 text-gray-700 cursor-pointer"
            onClick={() => {
              removeQuantityProductList(data);
            }}
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-semibold w-6 text-center">
            {data.quantity}
          </span>
          <button
            className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-1 hover:bg-primary-600 text-white cursor-pointer"
            onClick={() => {
              addQuantity(data);
            }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderProductCard;
