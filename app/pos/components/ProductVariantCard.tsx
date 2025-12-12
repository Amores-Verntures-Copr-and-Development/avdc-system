import { DisplayProductsDtos } from "@/dtos/products.dto";
import { ProductVariants } from "@/types/products";
import { formatPeso } from "@/utils/formatPeso";
import { Package, ShoppingCart, Tag } from "lucide-react";
import React from "react";
import { OrderList } from "../PosPage";

interface ProductVariantCardProps {
  data: ProductVariants | null;
  product: DisplayProductsDtos | null;
  onClick: (data: ProductVariants) => void;
  addProductOrder: (data: OrderList) => void;
}

const ProductVariantCard = ({
  onClick,
  data,
  product,
  addProductOrder,
}: ProductVariantCardProps) => {
  return (
    <div
      className="group min-h-40 flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 border border-gray-200 hover:border-primary-1/50 cursor-pointer overflow-hidden relative"
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
          <div className="flex items-start gap-2 mb-2">
            <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5 group-hover:primary-1 transition-colors">
                {product?.prodName}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-3 h-3 text-primary-1" />
            <span className="text-xs font-medium text-primary-1 bg-primary-1/10 px-2 py-0.5 rounded">
              {data?.prodVarName}
            </span>
          </div>
        </div>

        {/* Price Badge */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-br from-primary-1/90 to-primary-1 text-white px-3 py-2 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
            <div className="text-sm font-bold whitespace-nowrap">
              {formatPeso(data?.prodVarPrice)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action Hint */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Variant ID: {data?.prodVarId}
        </span>
        <div className="flex items-center gap-1 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <ShoppingCart className="w-3 h-3" />
          <span className="text-xs font-medium">Select</span>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantCard;
