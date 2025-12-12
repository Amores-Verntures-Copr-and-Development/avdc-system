import React from "react";
import { OrderProduct } from "../../PosPage";
import OrderProductCard from "../OrderProductCard";

interface OrderDetailsProps {
  data: OrderProduct[];
}

const OrderDetails = ({ data }: OrderDetailsProps) => {
  return (
    <div className="flex flex-col gap-4">
      {data.map((prod) => (
        <OrderProductCard data={prod} key={prod.prodVarId} />
      ))}
    </div>
  );
};

export default OrderDetails;
