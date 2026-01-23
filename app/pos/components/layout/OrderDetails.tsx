import React from "react";
import { OrderList } from "../../PosPage";
import OrderProductCard from "../OrderProductCard";

interface OrderDetailsProps {
  data: OrderList[] | null;
  removeQuantityProductList: (data: OrderList) => void;
  addQuantity: (data: OrderList) => void;
  removeProduct: (data: OrderList) => void;
}

const OrderDetails = ({
  data,
  removeQuantityProductList,
  addQuantity,
  removeProduct,
}: OrderDetailsProps) => {
  return (
    <div className="flex flex-col gap-2 2xl:gap-4">
      {data?.map((prod) => (
        <OrderProductCard
          removeQuantityProductList={removeQuantityProductList}
          data={prod}
          key={prod.prodVarId}
          addQuantity={addQuantity}
          removeProduct={removeProduct}
        />
      ))}
    </div>
  );
};

export default OrderDetails;
