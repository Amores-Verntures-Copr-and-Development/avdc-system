import { DisplayAllInventory } from "@/app/inventory/InventoryPage";
import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import LoaderComponent from "@/components/shared/LoaderComponent";
import SearchInventoryItem, {
  DisplaInventoryItems,
} from "@/components/shared/SearchInventoryItem";
import Toggle from "@/components/shared/Toggle";
import { CreatePurchaseOrderItemDto } from "@/dtos/purchase.dto";
import { useUserInventory } from "@/hooks/useInventory";
import { useSession } from "@/hooks/useSession";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { StockRoom } from "@/types/stockRoom";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface ReplacePOItemComponentProps {
  data: PurchaseOrderItems | null;
  onClose: () => void;
  mutate: () => void;
}

const ReplacePOItemComponent = ({
  data,
  onClose,
  mutate,
}: ReplacePOItemComponentProps) => {
  const { user, hasStore } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSameStatus, setIsSameStatus] = useState(true);
  const [isSameSupplier, setIsSameSupplier] = useState(true);
  const { inventory, inventoryLoading, stockRoomId, error } = useUserInventory(
    user,
    hasStore,
  );

  const [replaceForm, setReplaceForm] = useState<CreatePurchaseOrderItemDto>({
    poId: data?.poId ?? 0,
    poItemOrderedQty: 0,
    poItemReceivedQty: 0,
    poItemStatus: "sent",
    itemId: 0,
    suppId: 0,
    unitPrice: 0,
  });

  const handleReplacePoItems = async () => {
    const validateForm: PurchaseOrderItems = {
      poId: data?.poId ?? 0,
      poItemId: 0,
      poItemOrderedQty: replaceForm.poItemOrderedQty,
      poItemStatus: isSameStatus === true ? data?.poItemStatus : "pending",
      suppId: isSameSupplier === true ? data?.suppId : null,
      unitPrice: replaceForm.unitPrice,
      itemId: replaceForm.itemId,
      poItemReceivedQty: 0,
    };
    const replaceFormData = {
      from: data,
      to: validateForm,
      replacedBy: user?.userId,
    };
    console.log(replaceFormData);
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/purchase-order/po-items/${replaceForm.poId}/${data?.poItemId}/replace/`,
        {
          method: "POST",
          body: JSON.stringify(replaceFormData),
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      mutate();
      toast.success(result.message);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChangeForm = handleChange(replaceForm, setReplaceForm);
  if (inventoryLoading) return <LoaderComponent />;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-sm">
        Note:<span className="font-normal"> Replace selected po item.</span>
      </h3>
      <BigCard title={"Selected Item"} isRounded={false}>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Name</span>
              <span className="text-sm font-medium">{data?.itemName}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Unit</span>
              <span className="text-sm font-medium">{data?.itemName}</span>
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Price</span>
              <span className="text-sm font-medium">
                {formatPeso(data?.unitPrice)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Ordered Quantity</span>
              <span className="text-sm font-medium">
                {data?.poItemOrderedQty}
              </span>
            </div>
          </div>
        </div>
      </BigCard>
      <BigCard title={"Replace Item"} isRounded={false}>
        <div className="flex flex-col gap-2">
          <SearchInventoryItem
            sizes="xs"
            onSelect={function (item: DisplaInventoryItems): void {
              if (item) {
                setReplaceForm((prev) => ({
                  ...prev,
                  itemId: item.itemId,
                  unitPrice: item.itemPrice,
                }));
              } else {
                setReplaceForm({
                  poId: data?.poId ?? 0,
                  poItemOrderedQty: 0,
                  poItemReceivedQty: 0,
                  poItemStatus: "sent",
                  itemId: 0,
                  suppId: 0,
                  unitPrice: 0,
                });
              }
            }}
            inventoryId={inventory[0].inventoryId}
            label="Select item"
          />
          <Input
            label={"Ordered Quantity"}
            sizes="xs"
            value={
              replaceForm.poItemOrderedQty === 0
                ? ""
                : replaceForm.poItemOrderedQty
            }
            name="poItemOrderedQty"
            onChange={onChangeForm}
          />
          <Toggle
            label="Same status?"
            sizes="xs"
            flexType="flex-col"
            initial={isSameStatus}
            onToggle={(state) => setIsSameStatus(state)}
          />
          <Toggle
            label="Same supplier?"
            sizes="xs"
            flexType="flex-col"
            initial={isSameSupplier}
            onToggle={(state) => setIsSameSupplier(state)}
          />
        </div>
      </BigCard>
      <div className="flex justify-end gap-2">
        <div>
          <Button
            label="Cancel"
            size="sm"
            color="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Button
            label="Replace"
            size="sm"
            onClick={handleReplacePoItems}
            loading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default ReplacePOItemComponent;
