import {
  DisplaProductVariantsDtos,
  DisplayProductsDtos,
} from "@/dtos/products.dto";
import { ProductVariants } from "@/types/products";
import { formatPeso } from "@/utils/formatPeso";
import { Tag, TrendingUp, Package, AlertCircle } from "lucide-react";
import React from "react";
import { OrderList } from "../PosPage";

interface ProductVariantCardProps {
  data: DisplaProductVariantsDtos | null;
  product: DisplayProductsDtos | null;
  onClick: (data: ProductVariants) => void;
  addProductOrder: (data: OrderList) => void;
}

const ProductVariantCard = ({
  data,
  product,
  addProductOrder,
}: ProductVariantCardProps) => {
  const handleClick = () => {
    if (!data || !product || !hasStock) return;

    const variantName = data.prodVarName?.trim() || "";
    const productName = product.prodName?.trim() || "";

    // Split words for smarter check
    const variantWords = variantName.toLowerCase().split(" ");
    const productLower = productName.toLowerCase();

    // If any word from variant is already in product, keep product name
    const alreadyIncluded = variantWords.some((word) =>
      productLower.includes(word)
    );

    const prodVarName = alreadyIncluded
      ? variantName
      : `${productName} ${variantName}`;

    addProductOrder({
      prodVarId: data.prodVarId,
      prodVarName: prodVarName,
      quantity: 1,
      prodVarPrice: data.prodVarPrice,
    });
  };

  const hasOneVariant = data?.variantComponents?.length === 1;
  const left = hasOneVariant ? data.variantComponents?.[0]?.left ?? 0 : 0;
  const sold = hasOneVariant ? data.variantComponents?.[0]?.sold ?? 0 : 0;
  const hasStock = !hasOneVariant || left > 0;

  // Safety check for missing data
  if (!data || !product) {
    return null;
  }

  return (
    <div
      className={`group relative min-h-[120px] flex flex-col bg-white rounded-xl shadow-sm transition-all duration-300 p-4 border overflow-hidden ${
        hasStock
          ? "hover:shadow-xl border-gray-200 hover:border-primary-1 cursor-pointer active:scale-[0.98]"
          : "border-gray-300 opacity-75 cursor-not-allowed"
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={hasStock ? 0 : -1}
      onKeyDown={(e) => {
        if (hasStock && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={
        hasStock
          ? `Add ${data.prodVarName} to cart for ${formatPeso(
              data.prodVarPrice
            )}`
          : `${data.prodVarName} - Out of stock`
      }
      aria-disabled={!hasStock}
    >
      {/* Accent line - only show when in stock */}
      {hasStock && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-1 via-primary-1-hover to-primary-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      )}

      {/* Out of stock overlay */}
      {!hasStock && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
      )}

      {/* Hover glow effect - only when in stock */}
      {hasStock && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-1/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Header section */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <div
                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  hasStock
                    ? "bg-primary-1/10 group-hover:bg-primary-1/20"
                    : "bg-gray-200"
                }`}
              >
                <Tag
                  className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${
                    hasStock ? "text-primary-1" : "text-gray-400"
                  }`}
                />
              </div>
              <span
                className={`text-xs xl:text-sm font-semibold break-words leading-tight ${
                  hasStock ? "text-gray-700" : "text-gray-500"
                }`}
              >
                {data.prodVarName}
              </span>
            </div>

            {/* Product base name (if different from variant) */}
            {product.prodName &&
              !product.prodName
                .toLowerCase()
                .includes(data.prodVarName.toLowerCase()) && (
                <div className="flex items-start gap-1.5 ml-1">
                  <Package className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-[10px] xl:text-xs text-gray-500 break-words leading-tight">
                    {product.prodName}
                  </span>
                </div>
              )}
          </div>

          {/* Price Badge - Enhanced */}
          <div className="flex">
            <div className="relative">
              {hasStock && (
                <div className="absolute inset-0 bg-primary-1 rounded-lg blur-sm opacity-0 group-hover:opacity-30 transition-opacity"></div>
              )}

              <div
                className={`relative text-white px-1.5 py-1 rounded-lg shadow-md transition-all ${
                  hasStock
                    ? "bg-gradient-to-br from-primary-1 to-primary-1-hover group-hover:shadow-lg group-hover:-translate-y-0.5"
                    : "bg-gray-400"
                }`}
              >
                <div className="text-[10px] xl:text-xs font-bold whitespace-nowrap">
                  {formatPeso(data.prodVarPrice)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer to push footer to bottom */}
        <div className="flex-1"></div>

        {/* Out of Stock Banner */}
        {!hasStock && (
          <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-red-700">
              No Stock Available
            </span>
          </div>
        )}

        {/* Footer section */}
        {hasStock && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 group-hover:border-primary-1/20 transition-colors">
            <div className="flex items-center gap-1 bg-gray-50 group-hover:bg-primary-1/5 px-2 py-1 rounded transition-colors">
              <Package className="w-3 h-3 text-green-700 group-hover:text-green-900 transition-colors" />
              <span className="text-[9px] xl:text-xs text-gray-600 font-semibold">
                {left} <span className="text-[9px] xl:text-xs">left</span>
              </span>
            </div>

            <div className="flex items-center gap-1 bg-gray-50 group-hover:bg-primary-1/5 px-2 py-1 rounded transition-colors">
              <TrendingUp className="w-3 h-3 text-orange-500 group-hover:text-orange-600 transition-colors" />
              <span className="text-[9px] xl:text-xs text-gray-600 font-semibold">
                {sold} <span className="text-[9px] xl:text-xs">sold</span>
              </span>
            </div>
          </div>
        )}

        {/* Click hint overlay - only when in stock */}
        {hasStock && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <span className="text-xs font-semibold text-primary-1">
                Click to add
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVariantCard;
