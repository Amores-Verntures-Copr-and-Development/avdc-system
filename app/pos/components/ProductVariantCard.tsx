import Image from "next/image";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { ProductVariants } from "@/types/products";
import { formatPeso } from "@/utils/formatPeso";

import { TrendingUp, Package, AlertCircle, ImageIcon } from "lucide-react";

import React from "react";
import { OrderList } from "../PosPage";

interface ProductVariantCardProps {
  data: ProductVariants | null;
  product: DisplayProductsDtos | null;
  onClick: (data: ProductVariants) => void;
  addProductOrder: (data: OrderList) => void;
  showImage?: boolean;
}

const ProductVariantCard = ({
  data,
  product,
  addProductOrder,
  showImage = true,
}: ProductVariantCardProps) => {
  if (!data || !product) {
    return null;
  }

  const deductInventory = Number(data.isDeductInv) === 1;

  const hasInventoryItem = Boolean(data.inventoryItemId);

  const hasVariantComponents =
    Array.isArray(data.variantComponents) && data.variantComponents.length > 0;

  const directStocks = Number(data.stocks || 0);

  const available = (() => {
    // Type 1 & 2: ProductVariant has inventoryItemId
    if (hasInventoryItem) {
      return directStocks;
    }

    // Type 3: No inventoryItemId but has variantComponents
    if (hasVariantComponents && data.variantComponents) {
      return Math.min(
        ...data?.variantComponents?.map((item) => Number(item.left || 0)),
      );
    }

    // Type 4: No inventoryItemId and no variantComponents
    return Infinity;
  })();

  const hasNoAssignComponent =
    deductInventory && !hasInventoryItem && !hasVariantComponents;

  const hasStock = (() => {
    if (!deductInventory) {
      return true;
    }

    // Type 1 & 2
    if (hasInventoryItem) {
      return directStocks > 0;
    }

    // Type 3
    if (hasVariantComponents && data?.variantComponents) {
      return data.variantComponents.every((item) => Number(item.left || 0) > 0);
    }

    // Type 4
    return true;
  })();

  const imageUrl = product.productImage || "";

  const handleClick = () => {
    if (!hasStock) return;

    const variantName = data.prodVarName?.trim() || "";
    const productName = product.prodName?.trim() || "";

    const variantWords = variantName.toLowerCase().split(" ");
    const productLower = productName.toLowerCase();

    const alreadyIncluded = variantWords.some((word) =>
      productLower.includes(word),
    );

    const prodVarName = alreadyIncluded
      ? variantName
      : `${productName} ${variantName}`;

    addProductOrder({
      prodVarId: data.prodVarId,
      prodVarName,
      quantity: 1,
      prodVarPrice: data.prodVarPrice,
      inventoryItemId: data.inventoryItemId,

      components:
        data.variantComponents
          ?.filter((item) => Boolean(item.isDeductVar) === true)
          .map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantityRequired: item.quantityRequired,
          })) || [],
    });
  };

  return (
    <div
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
          ? `Add ${data.prodVarName} to cart`
          : `${data.prodVarName} - Out of stock`
      }
      aria-disabled={!hasStock}
      className={`
        group relative overflow-hidden rounded-2xl border bg-white shadow-sm
        transition-all duration-300
        ${
          hasStock
            ? `
              cursor-pointer border-gray-100
              hover:-translate-y-0.5 hover:border-primary-1/20
              hover:shadow-xl active:scale-[0.99]
            `
            : `
              border-gray-200 opacity-70
            `
        }
      `}
    >
      <div
        className={`
          absolute left-0 top-0 h-1 w-full
          ${
            hasStock
              ? `
                origin-left scale-x-0 bg-gradient-to-r
                from-primary-1 to-pink-400
                transition-transform duration-300 group-hover:scale-x-100
              `
              : `
                bg-gradient-to-r from-red-500 to-red-600
              `
          }
        `}
      />

      {showImage && (
        <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <div
            className={`
              absolute right-2 top-2 z-10 rounded-xl px-2.5 py-1
              text-xs font-bold text-white shadow-lg backdrop-blur-sm
              ${
                hasStock
                  ? `bg-gradient-to-br from-primary-1 to-pink-500`
                  : `bg-gray-400`
              }
            `}
          >
            {formatPeso(data.prodVarPrice)}
          </div>

          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={data.prodVarName}
              fill
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300">
              <ImageIcon className="h-8 w-8" />
              <span className="mt-1 text-[10px] font-medium">No Image</span>
            </div>
          )}

          {!hasStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <div className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                Out of Stock
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2
              className={`
                line-clamp-2 text-sm font-semibold leading-tight
                ${hasStock ? "text-gray-900" : "text-gray-500"}
              `}
            >
              {data.prodVarName}
            </h2>

            {product.prodName &&
              !product.prodName
                .toLowerCase()
                .includes(data.prodVarName.toLowerCase()) && (
                <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                  {product.prodName}
                </p>
              )}
          </div>
        </div>

        {!hasStock && deductInventory && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
            <AlertCircle className="h-4 w-4 text-red-500" />

            <span className="text-xs font-medium text-red-600">
              {hasNoAssignComponent
                ? "No Assigned Inventory"
                : "No Stock Available"}
            </span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            {deductInventory && (
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1">
                <Package className="h-3.5 w-3.5 text-emerald-600" />

                <span className="text-xs font-semibold text-gray-700">
                  {available === Infinity ? "Available" : `${available} left`}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-2 py-1">
            <TrendingUp className="h-3.5 w-3.5 text-orange-500" />

            <span className="text-xs font-semibold text-orange-600">
              {data.sold ?? 0} sold
            </span>
          </div>
        </div>
      </div>

      {hasStock && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="rounded-xl bg-white/90 px-4 py-2 text-xs font-semibold text-primary-1 shadow-xl backdrop-blur-sm">
            Click to add
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariantCard;
