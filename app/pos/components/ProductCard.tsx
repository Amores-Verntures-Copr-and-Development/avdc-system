import { DisplayProductsDtos } from "@/dtos/products.dto";
import { formatPeso } from "@/utils/formatPeso";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import React from "react";

interface ProductCardProps {
  data: DisplayProductsDtos;
  addProductOrder: (data: DisplayProductsDtos) => void;
}

const ProductCard = ({ data, addProductOrder }: ProductCardProps) => {
  const isOutOfStock = (data.inventoryItemQuantity ?? 0) <= 0;

  return (
    <div
      className={`flex flex-col bg-white rounded-lg shadow-md transition-shadow duration-200 p-4 border ${
        isOutOfStock
          ? "border-gray-200 opacity-50 cursor-not-allowed"
          : "border-gray-100 hover:shadow-lg cursor-pointer"
      }`}
      onClick={() => {
        if (!isOutOfStock) addProductOrder(data);
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h2 className="text-xs font-semibold text-gray-900 mb-1">
            {data.itemName}
          </h2>
          <span className="inline-block text-[10px] text-primary-1 bg-primary-1/10 font-medium px-2 py-1 rounded-md">
            {data.categoryName}
          </span>
        </div>
        <div className="ml-3 flex-shrink-0">
          <span
            className={`flex items-center justify-center w-7 h-7 text-sm rounded-full font-bold shadow-sm ${
              isOutOfStock
                ? "bg-gray-300 text-gray-700"
                : "bg-primary-1 text-white"
            }`}
          >
            {formatQuantityByUnit(data.inventoryItemQuantity, data.itemUnit)}
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-2 pt-3 border-t border-gray-100">
        <span className="text-sm font-bold text-gray-900">
          {formatPeso(data.productPrice)}
        </span>

        {isOutOfStock ? (
          <span className="text-[11px] font-semibold text-red-500">
            Out of stock
          </span>
        ) : (
          <button className="text-xs text-primary-1 hover:text-primary-1-hover font-semibold transition-colors">
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
