import React from "react";
import { OrderList } from "../../PosPage";
import OrderProductCard from "../OrderProductCard";

interface OrderDetailsProps {
  data: OrderList[] | null;
}

const OrderDetails = ({ data }: OrderDetailsProps) => {
  return (
    <div className="flex flex-col gap-4">
      {data?.map((prod) => (
        <OrderProductCard data={prod} key={prod.prodVarId} />
      ))}
    </div>
  );
};

export default OrderDetails;
