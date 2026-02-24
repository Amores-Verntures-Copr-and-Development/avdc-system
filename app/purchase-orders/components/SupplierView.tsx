import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import { DisplayPOItemsSupplier } from "@/dtos/purchase.dto";
import { ApiResponse } from "@/types/api";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
interface SupplierViewProps {
  data: PurchaseOrders | null;
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request" | "supplier">
  >;
}
const SupplierView = ({ data, setShowAllItems }: SupplierViewProps) => {
  const [isExpandedSupplier, setIsExpandedSupplier] = useState<number | null>(
    null,
  );
  const {
    data: itemResponse = { data: [] },
    isLoading: loadingData,
    mutate,
  } = useSWR<ApiResponse<DisplayPOItemsSupplier[]>>(
    `/api/purchase-order/po-items-supplier/${data?.poId}`,
    fetcher,
  );

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
      <div className="flex flex-1 gap-2 flex-col">
        {loadingData ? (
          <LoaderComponent />
        ) : (
          itemResponse.data &&
          itemResponse.data.map((s, index) => {
            console.log({ s });
            const totalItemsSupplier = s.items
              .filter(
                (i) =>
                  i.poItemStatus === "sent" ||
                  i.poItemStatus === "received" ||
                  i.poItemStatus === "delivered",
              )
              .reduce((total, item) => {
                // skip not_ordered (extra safety)
                if (item.poItemStatus === "not_ordered") return total;

                const hasComposite =
                  item.composite && item.composite.length > 0;

                if (hasComposite) {
                  const compositeTotal = item.composite
                    ?.filter((c) => c !== null)
                    .reduce((sum, c) => {
                      return (
                        sum + Number(c.ordComQuantity) * Number(c.itemPrice)
                      );
                    }, 0);

                  return total + Number(compositeTotal);
                }

                const price = Number(item.supplierPrice || item.unitPrice) || 0;

                const qty = Number(
                  item.poItemReceivedQty > 0
                    ? item.poItemReceivedQty
                    : item.poItemOrderedQty,
                );

                return total + price * qty;
              }, 0);
            return (
              <div
                key={index}
                className="border border-gray-200 shadow  rounded-lg overflow-hidden flex flex-col p-2   bg-white  cursor-pointer hover:from-gray-100 transition "
              >
                <div className="bg-gradient-to-r flex flex-col gap-2">
                  <div className="flex justify-between overflow-visible">
                    <div className="flex items-start gap-2">
                      <Package className="text-primary-1" size={24} />
                      <div className="flex flex-col items-start gap-1">
                        <h1 className="font-semibold text-sm">{s.suppName}</h1>
                        <div className="flex text-xs text-gray-600 gap-4">
                          {s.suppAddress && (
                            <span>Location: {s.suppAddress}</span>
                          )}
                          {s.suppEmail && <span>Email: {s.suppEmail}</span>}
                          {s.suppPhone && <span>Phone: {s.suppPhone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="flex flex-col gap-2 items-end">
                        <span className="text-[9px] xl:text-xs">
                          Total Amount
                        </span>
                        <p className="font-bold text-primary-1 text-sm xl:text-lg">
                          {formatPeso(totalItemsSupplier)}
                        </p>
                        <span className="text-[9px] xl:text-xs">
                          {s.items.length} item(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-300"></div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        console.log(s);
                        setIsExpandedSupplier(
                          isExpandedSupplier ? null : s.suppId,
                        );
                      }}
                      className="inline-flex items-center px-1 py-.5 xl:px-3 xl:py-1.5 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {isExpandedSupplier ? "Hide Details" : "View Details"}
                      {isExpandedSupplier ? (
                        <ChevronUp className="w-4 h-4 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-2" />
                      )}
                    </button>
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
