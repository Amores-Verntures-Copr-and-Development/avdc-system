import { DisplayProductsDtos } from "@/dtos/products.dto";
import React from "react";
import ProductCard from "../ProductCard";
import { OrderProduct } from "../../PosPage";

interface ProductContentProps {
  data: DisplayProductsDtos[];
  selectedProduct: OrderProduct[];
  addProductOrder: (data: DisplayProductsDtos) => void;
}

const ProductContent = ({ data, addProductOrder }: ProductContentProps) => {
  return (
    <div className="flex-1 grid grid-cols-5 p-2 gap-4 overflow-y-auto auto-rows-max items-start">
      {data.map((prod) => (
        <ProductCard
          key={prod.productId}
          data={prod}
          addProductOrder={addProductOrder}
        />
      ))}
    </div>
  );
};

export default ProductContent;
