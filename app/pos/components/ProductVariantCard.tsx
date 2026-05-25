import Image from "next/image";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { ProductVariants } from "@/types/products";
import { formatPeso } from "@/utils/formatPeso";

import { Tag, TrendingUp, Package, AlertCircle, ImageIcon } from "lucide-react";

import React from "react";
import { OrderList } from "../PosPage";

interface ProductVariantCardProps {
  data: ProductVariants | null;
  product: DisplayProductsDtos | null;
  onClick: (data: ProductVariants) => void;
  addProductOrder: (data: OrderList) => void;

  // NEW
  showImage?: boolean;
}

const ProductVariantCard = ({
  data,
  product,
  addProductOrder,
  showImage = true,
}: ProductVariantCardProps) => {
  const deductInventory = Number(data?.isDeductInv) === 1;

  const hasOneVariant = data?.variantComponents?.length === 1;

  const left = hasOneVariant ? (data.variantComponents?.[0]?.left ?? 0) : 0;

  const hasNoAssignComponent = !data?.variantComponents?.length;

  const hasMoreVariant =
    data?.variantComponents?.length && data?.variantComponents?.length > 1;

  const hasStock = hasMoreVariant
    ? data?.variantComponents &&
      data?.variantComponents?.every((i) => i.left !== 0)
    : deductInventory
      ? left > 0
      : true;

  // CHANGE THIS FIELD BASED ON YOUR DB
  const imageUrl = product?.productImage || "";

  const handleClick = () => {
    if (!data || !product || !hasStock) return;

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

    if (hasOneVariant && data.variantComponents) {
      addProductOrder({
        prodVarId: data.prodVarId,
        prodVarName,
        quantity: 1,
        prodVarPrice: data.prodVarPrice,

        components: [
          {
            inventoryItemId: data.variantComponents[0].inventoryItemId,

            quantityRequired: data.variantComponents[0].quantityRequired,
          },
        ],
      });
    } else {
      addProductOrder({
        prodVarId: data.prodVarId,
        prodVarName,
        quantity: 1,
        prodVarPrice: data.prodVarPrice,

        components:
          data.variantComponents
            ?.filter((i) => Boolean(i.isDeductVar) === true)
            .map((i) => ({
              inventoryItemId: i.inventoryItemId,

              quantityRequired: i.quantityRequired,
            })) || [],
      });
    }
  };

  if (!data || !product) {
    return null;
  }

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
        group relative overflow-hidden
        rounded-2xl border
        bg-white
        shadow-sm
        transition-all duration-300
        
        ${
          hasStock
            ? `
              cursor-pointer
              border-gray-100
              hover:-translate-y-0.5
              hover:border-primary-1/20
              hover:shadow-xl
              active:scale-[0.99]
            `
            : `
              border-gray-200
              opacity-70
            `
        }
      `}
    >
      {/* Top Accent */}
      <div
        className={`
          absolute left-0 top-0 h-1 w-full
          
          ${
            hasStock
              ? `
                origin-left scale-x-0
                bg-gradient-to-r
                from-primary-1
                to-pink-400
                transition-transform duration-300
                group-hover:scale-x-100
              `
              : `
                bg-gradient-to-r
                from-red-500
                to-red-600
              `
          }
        `}
      />

      {/* Image */}
      {showImage && (
        <div
          className="
      relative flex h-32 items-center justify-center
      overflow-hidden
      bg-gradient-to-br
      from-gray-50 to-gray-100
    "
        >
          <div
            className={`
        absolute right-2 top-2 z-10
        rounded-xl px-2.5 py-1
        text-xs font-bold text-white
        shadow-lg backdrop-blur-sm
        
        ${
          hasStock
            ? `
              bg-gradient-to-br
              from-primary-1
              to-pink-500
            `
            : `
              bg-gray-400
            `
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
              className="
                object-contain
                p-3
                transition-transform duration-300
                group-hover:scale-105
              "
            />
          ) : (
            <div
              className="
                flex flex-col items-center justify-center
                text-gray-300
              "
            >
              <ImageIcon className="h-8 w-8" />

              <span className="mt-1 text-[10px] font-medium">No Image</span>
            </div>
          )}

          {/* Out of stock overlay */}
          {!hasStock && (
            <div
              className="
                absolute inset-0
                flex items-center justify-center
                bg-black/20
                backdrop-blur-[1px]
              "
            >
              <div
                className="
                  rounded-full bg-red-500
                  px-3 py-1
                  text-xs font-semibold text-white
                "
              >
                Out of Stock
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
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
                    <p
                      className="
                        mt-1 line-clamp-1
                        text-xs text-gray-400
                      "
                    >
                      {product.prodName}
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>

        {!hasStock && Number(data.isDeductInv) === 1 && (
          <div
            className="
                mt-3 flex items-center gap-2
                rounded-xl border border-red-100
                bg-red-50 px-3 py-2
              "
          >
            <AlertCircle className="h-4 w-4 text-red-500" />

            <span
              className="
                  text-xs font-medium text-red-600
                "
            >
              {hasNoAssignComponent
                ? "No Assigned Component"
                : "No Stock Available"}
            </span>
          </div>
        )}

        {/* Footer */}
        {hasStock && (
          <div
            className="
              mt-4 flex items-center justify-between
              border-t border-gray-100
              pt-3
            "
          >
            {/* Left */}
            <div>
              {Number(data.isDeductInv) === 1 ? (
                hasOneVariant && (
                  <div
                    className="
                      flex items-center gap-1.5
                      rounded-lg bg-gray-50
                      px-2 py-1
                    "
                  >
                    <Package className="h-3.5 w-3.5 text-emerald-600" />

                    <span
                      className="
                        text-xs font-semibold text-gray-700
                      "
                    >
                      {left} left
                    </span>
                  </div>
                )
              ) : (
                <div />
              )}
            </div>

            {/* Sold */}
            <div
              className="
                flex items-center gap-1.5
                rounded-lg bg-orange-50
                px-2 py-1
              "
            >
              <TrendingUp className="h-3.5 w-3.5 text-orange-500" />

              <span
                className="
                  text-xs font-semibold text-orange-600
                "
              >
                {data.sold} sold
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hover CTA */}
      {hasStock && (
        <div
          className="
            pointer-events-none absolute inset-0
            flex items-center justify-center
            opacity-0 transition-opacity duration-200
            group-hover:opacity-100
          "
        >
          <div
            className="
              rounded-xl bg-white/90
              px-4 py-2
              text-xs font-semibold
              text-primary-1
              shadow-xl
              backdrop-blur-sm
            "
          >
            Click to add
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariantCard;
