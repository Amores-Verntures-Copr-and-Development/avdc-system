import React from "react";
import { OrderList } from "../../PosPage";
import OrderProductCard from "../OrderProductCard";

interface OrderDetailsProps {
  data: OrderList[] | null;
  removeQuantityProductList: (data: OrderList) => void;
  addQuantity: (data: OrderList) => void;
}

const OrderDetails = ({
  data,
  removeQuantityProductList,
  addQuantity,
}: OrderDetailsProps) => {
  return (
    <div className="flex flex-col gap-4">
      {data?.map((prod) => (
        <OrderProductCard
          removeQuantityProductList={removeQuantityProductList}
          data={prod}
          key={prod.prodVarId}
          addQuantity={addQuantity}
        />
      ))}
    </div>
  );
};

export default OrderDetails;
