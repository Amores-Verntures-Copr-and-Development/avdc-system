import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import Input from "@/components/shared/Input";
import { CreatePurchaseOrderItemDto } from "@/dtos/purchase.dto";
import { UserAuth } from "@/hooks/useSession";
import { ItemInterface } from "@/types/items";

import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddItemToPoModalProps {
  poId: number;
  user: UserAuth | null;
  currentItemId: number[];
  onAddItem: (
    data: CreatePurchaseOrderItemDto[],
    poId: number
  ) => Promise<boolean>;
  mutate: () => void;
}
const AddItemToPoModal = ({
  poId,

  currentItemId,
  onAddItem,
  mutate,
}: AddItemToPoModalProps) => {
  const [form, setForm] = useState<CreatePurchaseOrderItemDto>({
    poId: poId,
    itemId: 0,
    poItemOrderedQty: 0,
    poItemReceivedQty: 0,
    unitPrice: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleAddItemToPo = async () => {
    console.log({ form });
    console.log({ currentItemId });
    setIsSubmitting(true);

    try {
      if (form.itemId === 0) {
        toast.error("Please select an item");
        return;
      }
      if (currentItemId.includes(form.itemId)) {
        toast.error("Item is already in PO");
        return;
      }
      const success = await onAddItem([form], form.poId);
      if (success) {
        setForm({
          poId: poId,
          itemId: 0,
          poItemOrderedQty: 0,
          poItemReceivedQty: 0,
          unitPrice: 0,
          poItemStatus: "sent",
        });
        mutate();
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleItemChange = handleChange(form, setForm);
  return (
    <div className="flex flex-col h-full gap-2">
      <span className="text-sm mb-5">
        <span className="font-semibold">Note:</span> Search and select item in
        inventory to add in purchaser order.
      </span>
      <div className="flex gap-2">
        <DropDownSearchItem
          label="Item"
          onSelect={function (item: ItemInterface): void {
            if (item) {
              setForm((prev) => ({
                ...prev,
                itemId: item.itemId,
              }));
            } else {
              setForm((prev) => ({
                ...prev,
                itemId: 0,
              }));
            }
          }}
          sizes="xs"
        />
        <Input
          label={"Order Quantity"}
          sizes="xs"
          onChange={handleItemChange}
          value={form.poItemOrderedQty}
          name="poItemOrderedQty"
          type="number"
        />
      </div>
      <div className="flex justify-end gap-4 mt-auto">
        <div>
          <Button
            label="Cancel"
            size="sm"
            color="secondary"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Button
            label="Add Item"
            size="sm"
            onClick={handleAddItemToPo}
            loading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemToPoModal;
