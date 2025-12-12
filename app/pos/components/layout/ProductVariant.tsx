import React from "react";
import ProductVariantCard from "../ProductVariantCard";
import { ProductVariants } from "@/types/products";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import Button from "@/components/shared/Button";
import { ArrowLeft } from "lucide-react";
import { OrderList } from "../../PosPage";

interface ProductVariantProps {
  data?: DisplayProductsDtos | null | undefined;
  onClick: (data: ProductVariants) => void;
  onBack: () => void;
  addProductOrder: (data: OrderList) => void;
}

const ProductVariant = ({
  data,
  onClick,
  onBack,
  addProductOrder,
}: ProductVariantProps) => {
  return (
    <div className="h-full">
      <div className="flex justify-between p-2 bg-white border border-gray-200 items-center">
        <h1 className="font-semibold text-2xl">{data?.prodName}</h1>
        <div>
          <Button
            label="Back"
            size="sm"
            icon={<ArrowLeft className="w-5 h-5" />}
            onClick={onBack}
          />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-5 p-2 gap-4 overflow-y-auto auto-rows-max items-start">
        {data?.productVariants?.map((prod) => (
          <ProductVariantCard
            key={prod.prodVarId}
            data={prod}
            onClick={function (data: ProductVariants): void {
              throw new Error("Function not implemented.");
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
