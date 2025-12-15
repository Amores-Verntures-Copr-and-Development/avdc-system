import { DisplayProductsDtos } from "@/dtos/products.dto";
import { Package } from "lucide-react";
import React from "react";
import { OrderList } from "../PosPage";

interface ProductCardProps {
  data: DisplayProductsDtos;
  selectProduct?: (data: DisplayProductsDtos) => void;
  addProductOrder: (data: OrderList) => void;
}

const ProductCard = ({
  data,
  selectProduct,
  addProductOrder,
}: ProductCardProps) => {
  const variantCount = data.productVariants?.length ?? 0;
  return (
    <div
      className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 border border-gray-200 hover:border-primary-1/50 cursor-pointer overflow-hidden relative"
      onClick={() => {
        if (variantCount === 1 && data.productVariants) {
          addProductOrder({
            prodVarId: data.productVariants[0]?.prodVarId,
            prodVarName: `${data.prodName} ${data.productVariants[0]?.prodVarName}`,
            quantity: 1,
            prodVarPrice: data.productVariants[0]?.prodVarPrice,
          });
        }
        if (variantCount > 1 && selectProduct) {
          selectProduct(data);
        }
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-1 to-primary-1-hover transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h2 className="text-xs font-semibold text-gray-900 mb-1">
            {data.prodName}
          </h2>
          <span className="inline-block text-[10px] text-primary-1 bg-primary-1/10 font-medium px-2 py-1 rounded-md">
            {data.prodCatName ?? "No Category"}
          </span>
        </div>
        {data.productVariants?.length === 1 && (
          <div>
            <span className="text-xs font-semibold text-primary-600">
              {Number(data?.productVariants[0]?.prodVarPrice).toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                }
              )}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-2 pt-3 border-t border-gray-100">
        <Package className="w-4 h-4" />{" "}
        <span className="text-xs font-medium">
          {variantCount} variant{variantCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
