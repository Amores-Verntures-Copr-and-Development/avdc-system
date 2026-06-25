import React from "react";
import { OrderList } from "../../PosPage";
import OrderProductCard from "../OrderProductCard";
import { Discounts } from "@/types/discount";

interface OrderDetailsProps {
  data: OrderList[] | null;
  removeQuantityProductList: (data: OrderList) => void;
  addQuantity: (data: OrderList) => void;
  removeProduct: (data: OrderList) => void;
  setEditOrderAmount: React.Dispatch<React.SetStateAction<OrderList | null>>;
  discountLists?: Discounts[];
}

const OrderDetails = ({
  data,
  removeQuantityProductList,
  addQuantity,
  removeProduct,
  setEditOrderAmount,
  discountLists,
}: OrderDetailsProps) => {
  return (
    <div className="flex flex-col gap-2 2xl:gap-4">
      {data?.map((prod) => (
        <OrderProductCard
          setEditOrderAmount={setEditOrderAmount}
          removeQuantityProductList={removeQuantityProductList}
          data={prod}
          key={prod.prodVarId}
          addQuantity={addQuantity}
          removeProduct={removeProduct}
          discountLists={discountLists}
        />
      ))}
    </div>
  );
};

export default OrderDetails;
