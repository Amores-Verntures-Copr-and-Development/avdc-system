import { DisplayProductsDtos } from "@/dtos/products.dto";
import React from "react";
import ProductCard from "../ProductCard";
import { OrderList } from "../../PosPage";

interface ProductContentProps {
  data: DisplayProductsDtos[];
  selectProduct?: (data: DisplayProductsDtos) => void;
  addProductOrder: (data: OrderList) => void;
}

const ProductContent = ({
  data,
  selectProduct,
  addProductOrder,
}: ProductContentProps) => {
  return (
    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 p-2 gap-4 overflow-y-auto auto-rows-max items-start bg-white border  border-gray-200">
      {data.map((prod) => (
        <ProductCard
          key={prod.prodId}
          data={prod}
          selectProduct={selectProduct}
          addProductOrder={addProductOrder}
        />
      ))}
    </div>
  );
};

export default ProductContent;
