import Image from "next/image";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { getNextCloudImageUrl } from "@/utils/getNextCloudImageUrl";
import { Package, ImageIcon } from "lucide-react";
import React from "react";
import { OrderList } from "../PosPage";

interface ProductCardProps {
  data: DisplayProductsDtos;
  selectProduct?: (data: DisplayProductsDtos) => void;
  addProductOrder: (data: OrderList) => void;
  showImage?: boolean;
}

const ProductCard = ({
  data,
  selectProduct,
  addProductOrder,
  showImage = true,
}: ProductCardProps) => {
  const variantCount = data.productVariants?.length ?? 0;

  const variantImage = data.productVariants?.find(
    (v) => v.prodVarImage,
  )?.prodVarImage;

  const imageUrl = getNextCloudImageUrl(variantImage);

  const handleSelect = () => {
    if (variantCount === 1 && data.productVariants) {
      const variant = data.productVariants[0];

      const productName = data.prodName;

      const variantWords = variant.prodVarName.toLowerCase().split(" ");

      const productLower = productName.toLowerCase();

      const alreadyIncluded = variantWords.some((word) =>
        productLower.includes(word),
      );

      const prodVarName = alreadyIncluded
        ? variant.prodVarName
        : `${productName} ${variant.prodVarName}`;

      if (variant.variantComponents?.length === 1) {
        addProductOrder({
          prodVarId: variant.prodVarId,
          prodVarName,
          quantity: 1,
          prodVarPrice: variant.prodVarPrice,
          inventoryItemId: variant.inventoryItemId,
          components: variant.variantComponents.map((vc) => ({
            inventoryItemId: vc.inventoryItemId,
            quantityRequired: vc.quantityRequired,
          })),
        });
      } else {
        addProductOrder({
          prodVarId: variant.prodVarId,
          prodVarName,
          quantity: 1,
          prodVarPrice: variant.prodVarPrice,
          inventoryItemId: variant.inventoryItemId,
          components:
            variant.variantComponents
              ?.filter((i) => Boolean(i.isDeductVar) === true)
              .map((i) => ({
                inventoryItemId: i.inventoryItemId,

                quantityRequired: i.quantityRequired,
              })) || [],
        });
      }
    }

    if (variantCount > 1 && selectProduct) {
      selectProduct(data);
    }
  };
  const singleVariant = data.productVariants?.[0];

  const hasOneVariant = variantCount === 1;

  const isDeductibleSingle = Number(singleVariant?.isDeductInv) === 1;

  const available = Number(singleVariant?.stocks || 0);

  const isAvailable = !hasOneVariant
    ? true
    : !isDeductibleSingle
      ? true
      : available > 0;
  return (
    <div
      onClick={isAvailable ? handleSelect : undefined}
      className={`
    group relative overflow-hidden
    rounded-2xl border
    bg-white
    p-2 2xl:p-3
    shadow-sm
    transition-all duration-200
    
    ${
      isAvailable
        ? `
          cursor-pointer
          border-gray-100
          hover:-translate-y-0.5
          hover:border-primary-1/20
          hover:shadow-md
          active:scale-[0.99]
        `
        : `
          cursor-not-allowed
          border-gray-200
          opacity-70
        `
    }
  `}
    >
      {/* Top Hover Line */}
      <div
        className="
          absolute left-0 top-0 h-1 w-full
          origin-left scale-x-0
          bg-gradient-to-r
          from-primary-1 to-pink-400
          transition-transform duration-300
          group-hover:scale-x-100
        "
      />

      {/* Product Image */}
      {showImage && (
        <div
          className="
            relative mb-2
            flex h-20 2xl:h-28
            items-center justify-center
            overflow-hidden rounded-2xl
            bg-gradient-to-br
            from-gray-50 to-gray-100
          "
        >
          {hasOneVariant && (
            <div
              className="
      absolute right-2 top-2 z-10
      rounded-xl bg-primary-1
      px-2 py-1
      text-[9px] font-bold text-white
      shadow-lg
      2xl:text-xs
    "
            >
              {Number(singleVariant?.prodVarPrice || 0).toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                },
              )}
            </div>
          )}
          {imageUrl ? (
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-white shadow-sm">
              <Image
                src={imageUrl}
                alt={data.prodName}
                fill
                unoptimized
                className="object-contain p-2 transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          ) : (
            <div
              className="
                flex flex-col items-center justify-center
                text-gray-300
              "
            >
              <ImageIcon className="h-6 w-6 2xl:h-8 2xl:w-8" />

              <span
                className="
                  mt-1 text-[8px]
                  font-medium
                  2xl:text-[10px]
                "
              >
                No Image
              </span>
              {!isAvailable && (
                <div
                  className="
      absolute inset-0 z-20
      flex items-center justify-center
      bg-black/30
      backdrop-blur-[2px]
    "
                >
                  <div
                    className="
        rounded-full bg-red-500
        px-3 py-1
        text-[10px] font-semibold text-white
        shadow-lg
        2xl:text-xs
      "
                  >
                    Out of Stock
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-2">
        {/* Product Name + Price */}
        <div className="flex items-start justify-between gap-2">
          <h2
            className="
              line-clamp-2
              min-w-0 flex-1
              text-[10px]
              font-semibold
              leading-tight
              text-gray-900
              2xl:text-sm
            "
          >
            {data.prodName}
          </h2>

          {variantCount === 1 && (
            <span
              className="
                shrink-0
                text-[10px]
                font-bold
                text-gray-900
                2xl:text-sm
              "
            >
              {(
                Number(data.productVariants?.[0]?.prodVarPrice ?? 0) || 0
              ).toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              })}
            </span>
          )}
        </div>

        {/* Category */}
        <div className="flex flex-col 2xl:flex-row 2xl:justify-between 2xl:items-center">
          <span
            className="
              inline-flex items-center
              rounded-full
              bg-primary-1/10
              px-2 py-1
              text-[8px]
              font-medium
              text-primary-1
              2xl:text-[10px]
            "
          >
            {data.prodCatName || "No Category"}
          </span>
          {hasOneVariant && (
            <span className="text-[10px] 2xl:text-xs font-semibold">
              {singleVariant?.barcode}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="
    mt-3 flex items-center justify-between
    border-t border-gray-100
    pt-2
  "
      >
        {!hasOneVariant && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <Package className="h-3 w-3 2xl:h-4 2xl:w-4" />

            <span className="text-[9px] font-medium text-gray-600 2xl:text-xs">
              {variantCount} variant{variantCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {hasOneVariant ? (
          <div
            className={`flex w-full items-center gap-1.5 ${hasOneVariant && " justify-between"}`}
          >
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-600 2xl:text-[10px]">
              {available > 0
                ? `${available} left`
                : singleVariant?.isDeductInv
                  ? "Out of Stock"
                  : ""}
            </span>

            <span className="rounded-full bg-orange-50 px-2 py-1 text-[8px] font-semibold text-orange-600 2xl:text-[10px]">
              {singleVariant?.sold ?? 0} sold
            </span>
          </div>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-[8px] font-medium text-gray-600 2xl:text-[10px]">
            Select
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
