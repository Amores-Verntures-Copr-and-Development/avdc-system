import Image from "next/image";
import { DisplayProductsDtos } from "@/dtos/products.dto";
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

  const imageUrl = data.productImage;

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

          components: [
            {
              inventoryItemId: variant.variantComponents[0].inventoryItemId,

              quantityRequired: variant.variantComponents[0].quantityRequired,
            },
          ],
        });
      } else {
        addProductOrder({
          prodVarId: variant.prodVarId,
          prodVarName,
          quantity: 1,
          prodVarPrice: variant.prodVarPrice,

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

  return (
    <div
      onClick={handleSelect}
      className="
        group relative overflow-hidden
        rounded-2xl border border-gray-100
        bg-white
        p-2 2xl:p-3
        shadow-sm
        transition-all duration-200
        
        hover:-translate-y-0.5
        hover:border-primary-1/20
        hover:shadow-md
        
        active:scale-[0.99]
        cursor-pointer
      "
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
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={data.prodName}
              fill
              className="
                object-contain
                p-2
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
              {Number(
                data.productVariants?.[0]?.prodVarPrice || 0,
              ).toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              })}
            </span>
          )}
        </div>

        {/* Category */}
        <div>
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
        <div
          className="
            flex items-center gap-1.5
            text-gray-400
          "
        >
          <Package className="h-3 w-3 2xl:h-4 2xl:w-4" />

          <span
            className="
              text-[9px]
              font-medium
              text-gray-600
              2xl:text-xs
            "
          >
            {variantCount} variant
            {variantCount !== 1 ? "s" : ""}
          </span>
        </div>

        {variantCount > 1 && (
          <span
            className="
              rounded-full
              bg-gray-100
              px-2 py-1
              text-[8px]
              font-medium
              text-gray-600
              2xl:text-[10px]
            "
          >
            Select
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
