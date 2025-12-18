import { DisplayProductsDtos } from "@/dtos/products.dto";
import { ProductVariants } from "@/types/products";
import { formatPeso } from "@/utils/formatPeso";
import { Tag } from "lucide-react";
import React from "react";
import { OrderList } from "../PosPage";

interface ProductVariantCardProps {
  data: ProductVariants | null;
  product: DisplayProductsDtos | null;
  onClick: (data: ProductVariants) => void;
  addProductOrder: (data: OrderList) => void;
}

const ProductVariantCard = ({
  data,
  product,
  addProductOrder,
}: ProductVariantCardProps) => {
  return (
    <div
      className="group min-h-30 flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 border border-gray-200 hover:border-primary-1/50 cursor-pointer overflow-hidden relative"
      onClick={() => {
        if (!data) {
          return;
        }
        addProductOrder({
          prodVarId: data?.prodVarId,
          prodVarName: `${product?.prodName} ${data.prodVarName}`,
          quantity: 1,
          prodVarPrice: data.prodVarPrice,
        });
      }}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-1 to-primary-1-hover transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

      <div className="flex items-start justify-between gap-3">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Tag className="w-3 h-3 xl:h-6 xl:w-6 text-primary-1" />
            <span className="text-xs xl:text-lg font-semibold text-primary-1 bg-primary-1/10 px-2 py-0.5 rounded">
              {data?.prodVarName}
            </span>
          </div>
        </div>

        {/* Price Badge */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-br from-primary-1/90 to-primary-1 text-white px-3 py-2 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
            <div className=" text-[9px] xl:text-sm font-bold whitespace-nowrap">
              {formatPeso(data?.prodVarPrice)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action Hint */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <span className="text-[9px] xl:text-xs text-gray-500">
          Variant ID: {data?.prodVarId}
        </span>
        <span className="text-[9px] xl:text-xs text-gray-500">3 solds</span>
      </div>
    </div>
  );
};

export default ProductVariantCard;
