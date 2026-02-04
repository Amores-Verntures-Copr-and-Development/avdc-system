import IconButton from "@/components/shared/IconButton";
import { Edit, Minus, Plus, Trash } from "lucide-react";
import { OrderList } from "../PosPage";
import React from "react";

interface OrderItemProps {
  data: OrderList;
  removeQuantityProductList: (data: OrderList) => void;
  addQuantity: (data: OrderList) => void;
  removeProduct: (data: OrderList) => void;
  setEditOrderAmount: React.Dispatch<React.SetStateAction<OrderList | null>>;
}

const CompactOrderItem = ({
  data,
  setEditOrderAmount,
  removeQuantityProductList,
  addQuantity,
  removeProduct,
}: OrderItemProps) => {
  const unitPrice = Number(data.prodVarPrice);
  const totalPrice = data.prodVarTotal;

  return (
    <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between 2xl:gap-2 rounded-lg shadow-sm p-1 2xl:p-2 bg-white hover:shadow-md border border-gray-200 hover:border-primary-1/50 transition-all group">
      {/* Product name - flex-1 to take available space */}
      <div className="flex-1 justify-between flex w-full  2xl:min-w-0">
        <p className="text-[9px] 2xl:text-xs font-medium text-gray-800  group-hover:text-primary-1 transition-colors">
          {data.prodVarName}
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {unitPrice.toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP",
          })}
        </p>
      </div>

      {/* Quantity controls - compact */}
      <div className="flex justify-between items-center gap-1">
        <div className="flex  items-center gap-1.5 bg-gray-50 rounded-lg px-1.5 py-1 group-hover:bg-primary-1/5 transition-colors">
          <button
            className="flex items-center justify-center w-3 h-3 2xl:w-6 2xl:h-6 rounded-md bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-600 transition-colors active:scale-95"
            onClick={() => removeQuantityProductList(data)}
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="text-[9px] 2xl:text-sm font-bold text-gray-800 w-6 text-center">
            {data.quantity}
          </span>

          <button
            className="flex items-center justify-center w-3 h-3 2xl:w-6 2xl:h-6 rounded-md bg-primary-1 hover:bg-primary-1-hover text-white transition-colors active:scale-95 shadow-sm"
            onClick={() => addQuantity(data)}
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Total price - compact */}
        <div className="flex-shrink-0 text-right">
          <span className="text-[9px] 2xl:text-sm font-bold text-primary-1 whitespace-nowrap">
            {totalPrice?.toLocaleString("en-PH", {
              style: "currency",
              currency: "PHP",
            })}
          </span>
        </div>

        <div className="flex gap-1">
          <IconButton
            onClick={() => {
              setEditOrderAmount(data);
            }}
            label={"Edit Amount"}
            bg={"gray"}
            icon={<Edit className="w-2.5 h-2.5 2xl:w-3.5 2xl:h-3.5" />}
          />
          <IconButton
            onClick={() => {
              removeProduct(data);
            }}
            label={"Remove Product"}
            bg={"red"}
            icon={<Trash className="w-2.5 h-2.5 2xl:w-3.5 2xl:h-3.5" />}
          />
        </div>
      </div>
    </div>
  );
};

export default CompactOrderItem;
