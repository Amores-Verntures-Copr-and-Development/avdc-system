import React from "react";
import ProductVariantCard from "../ProductVariantCard";
import { ProductVariants } from "@/types/products";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { OrderList } from "../../PosPage";

interface ProductVariantProps {
  data?: DisplayProductsDtos | null | undefined;
  onClick: (data: ProductVariants) => void;
  onBack: () => void;
  addProductOrder: (data: OrderList) => void;
  addQuantity: (data: OrderList) => void;
}

const ProductVariant = ({ data, addProductOrder }: ProductVariantProps) => {
  const productVariants = data?.productVariants ?? [];

  // Reorder variants
  const reorderedVariants = (data?.productVariants ?? [])
    .slice()
    .sort((a, b) => {
      const aSingleAvailable =
        a.variantComponents?.length === 1 &&
        (a.variantComponents?.[0]?.left ?? 0) > 0;
      const bSingleAvailable =
        b.variantComponents?.length === 1 &&
        (b.variantComponents?.[0]?.left ?? 0) > 0;

      if (aSingleAvailable && !bSingleAvailable) return -1;
      if (!aSingleAvailable && bSingleAvailable) return 1;
      return 0;
    });
  return (
    <div className="h-full">
      <div className="flex-1 grid grid-cols-3 xl:grid-cols-5 p-2 gap-4 overflow-y-auto auto-rows-max items-start">
        {reorderedVariants &&
          reorderedVariants.length > 0 &&
          reorderedVariants.map((prod) => (
            <ProductVariantCard
              key={prod.prodVarId}
              data={prod}
              onClick={function (data: ProductVariants): void {
                console.log(data);
              }}
              product={data ?? null}
              addProductOrder={addProductOrder}
            />
          ))}
      </div>
    </div>
  );
};

export default ProductVariant;
