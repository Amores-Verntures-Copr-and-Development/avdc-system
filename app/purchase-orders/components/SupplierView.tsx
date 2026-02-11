import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import { DisplayPOItemsSupplier } from "@/dtos/purchase.dto";
import { ApiResponse } from "@/types/api";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import React from "react";
import useSWR from "swr";
interface SupplierViewProps {
  data: PurchaseOrders | null;
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request" | "supplier">
  >;
}
const SupplierView = ({ data, setShowAllItems }: SupplierViewProps) => {
  const {
    data: itemResponse = { data: [] },
    isLoading: loadingData,
    mutate,
  } = useSWR<ApiResponse<DisplayPOItemsSupplier[]>>(
    `/api/purchase-order/po-items-supplier/${data?.poId}`,
    fetcher,
  );
  console.log({ itemResponse });
  return (
    <div className="flex-col flex gap-2 mt-2 h-full">
      <div className="flex justify-between shadow bg-white p-2">
        <h1 className="font-semibold text-sm 2xl:text-md">
          Overview of Suppliers
        </h1>
        <div>
          <Button
            label="Back"
            size="sm"
            onClick={() => {
              setShowAllItems("status");
            }}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        {loadingData ? (
          <LoaderComponent />
        ) : (
          itemResponse.data &&
          itemResponse.data.map((s) => {
            const totalCost = s.items.reduce((total, items) => {
              const hasComposite = items.composite && items.composite;

              if (hasComposite) {
                const totalComposite = items.composite?.reduce(
                  (total, item) => {
                    const subtotal = item.ordComQuantity * item.itemPrice;
                    return (total += subtotal);
                  },
                  0,
                );
                return total + Number(totalComposite);
              }
              const itemTotal =
                items.poItemOrderedQty * Number(items.supplierPrice);
              return total + itemTotal;
            }, 0);
            return (
              <div key={s.suppId} className="shadow p-2 bg-white flex flex-col">
                <div className="flex justify-between">
                  <div>
                    <h3>{s.suppName}</h3>
                    <span>{s.items.length} items</span>
                  </div>
                  <div>
                    <h3>Total</h3>
                    <span>{formatPeso(totalCost)} </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SupplierView;
