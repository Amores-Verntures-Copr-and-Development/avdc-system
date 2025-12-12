import { DisplayProductsDtos } from "@/dtos/products.dto";
import React from "react";
import ProductCard from "../ProductCard";


interface ProductContentProps {
  data: DisplayProductsDtos[];
  selectProduct?: (data: DisplayProductsDtos) => void;
}

const ProductContent = ({ data, selectProduct }: ProductContentProps) => {
  return (
    <div className="flex-1 grid grid-cols-5 p-2 gap-4 overflow-y-auto auto-rows-max items-start">
      {data.map((prod) => (
        <ProductCard
          key={prod.prodId}
          data={prod}
          selectProduct={selectProduct}
        />
      ))}
    </div>
  );
};

export default ProductContent;
