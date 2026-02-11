import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import { DisplayPurchaseOrderItemsDto } from "@/dtos/purchase.dto";
import { formatPeso } from "@/utils/formatPeso";
import React, { useState } from "react";
import AddCompositeItem from "./AddCompositeItem";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { ItemInterface } from "@/types/items";
import { OrderCompositeItem } from "@/types/purchaseOrders";
import { ApiResponse } from "@/types/api";
import IconButton from "@/components/shared/IconButton";
import { Trash } from "lucide-react";

interface ViewCompositePOItemProps {
  data: DisplayPurchaseOrderItemsDto | null;
  setShowComponent: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface DisplayOrderCompositeItemDto
  extends OrderCompositeItem, ItemInterface {}
const ViewCompositePOItem = ({
  data,
  setShowComponent,
}: ViewCompositePOItemProps) => {
  const [showAddComposite, setShowAddComposite] = useState(false);
  const findSupplier = data?.suppliers?.find(
    (supp) => supp.suppId === data.suppId,
  );
  const {
    data: response,
    mutate,
    isLoading,
  } = useSWR<ApiResponse<DisplayOrderCompositeItemDto[]>>(
    data
      ? `/api/purchase-order/${data?.poId}/${data?.poItemId}/composite-item/`
      : null,
    fetcher,
  );
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-black font-semibold text-sm">
        Note:{" "}
        <span className="font-normal">
          View composite items to purchase item.
        </span>
      </h3>
      <BigCard title={"Purchase Item"} isRounded={false}>
        <div className="grid grid-cols-2 gap-y-4 gap-x-10 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Name</span>
            <span className="font-semibold text-gray-900">
              {data?.itemName}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Unit</span>
            <span className="font-semibold text-gray-900">
              {data?.itemUnit}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Ordered Qty</span>
            <span className="font-semibold text-gray-900">
              {data?.poItemOrderedQty}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Received</span>
            <span className="font-semibold text-gray-900">
              {data?.poItemReceivedQty}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Ordered Qty</span>
            <span className="font-semibold text-gray-900">
              {data?.poItemOrderedQty}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Supplier</span>
            <span className="font-semibold text-gray-900">
              {
                data?.suppliers?.find((supp) => supp.suppId === data.suppId)
                  ?.suppName
              }
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Price</span>
            <span className="font-semibold text-gray-900">
              {formatPeso(findSupplier?.suppItemPrice)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">
              {formatPeso(
                Number(data?.poItemOrderedQty) *
                  Number(findSupplier?.suppItemPrice),
              )}
            </span>
          </div>
        </div>
      </BigCard>

      <BigCard
        title={"Composite Item"}
        isRounded={false}
        leftTitle={
          <div className="flex">
            <div>
              {" "}
              <Button
                label="Add Composite"
                size="xs"
                onClick={() => {
                  setShowAddComposite(true);
                  setShowComponent(true);
                }}
              />
            </div>
          </div>
        }
      >
        <div className="flex flex-col  rounded-md overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-5 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
            <span>Item</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Price</span>
            <span className="text-right">Total</span>
            <span className="text-right">Action</span>
          </div>

          {/* Body */}
          <div className="flex flex-col">
            {response?.data && response?.data?.length > 0 ? (
              response.data.map((c) => (
                <div
                  key={c.ordComItemId}
                  className="grid grid-cols-5 px-3 py-2 text-sm border-b border-gray-300 last:border-b-0 hover:bg-gray-50"
                >
                  <span className=" text-gray-800 text-xs font-semibold">
                    {c.itemName}
                  </span>

                  <span className="text-center text-xs text-gray-700">
                    {c.ordComQuantity}
                  </span>

                  <span className="text-right text-xs  text-gray-800">
                    {formatPeso(c.itemPrice)}
                  </span>
                  <span className="text-right text-xs font-semibold text-gray-800">
                    {formatPeso(c.itemPrice * c.ordComQuantity)}
                  </span>
                  <div className="text-right">
                    {" "}
                    <IconButton
                      onClick={() => {}}
                      label="remove"
                      bg="red"
                      icon={<Trash className="w-3 h-3" />}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-gray-500 text-center">
                No composite items found.
              </div>
            )}
          </div>
        </div>
      </BigCard>
      <Modal
        className=""
        isOpen={showAddComposite}
        onClose={function (): void {
          setShowAddComposite(false);
          setShowComponent(false);
        }}
        title={`Add Composite to ${data?.itemName}`}
      >
        <AddCompositeItem
          mutate={mutate}
          data={data}
          onCancel={() => {
            setShowAddComposite(false);
            setShowComponent(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default ViewCompositePOItem;
