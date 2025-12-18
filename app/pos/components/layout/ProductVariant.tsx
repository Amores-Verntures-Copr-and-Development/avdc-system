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
  return (
    <div className="h-full">
      <div className="flex-1 grid grid-cols-3 xl:grid-cols-5 p-2 gap-4 overflow-y-auto auto-rows-max items-start">
        {data?.productVariants?.map((prod) => (
          <ProductVariantCard
            key={prod.prodVarId}
            data={prod}
            onClick={function (data: ProductVariants): void {
              console.log(data);
            }}
            product={data}
            addProductOrder={addProductOrder}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductVariant;
