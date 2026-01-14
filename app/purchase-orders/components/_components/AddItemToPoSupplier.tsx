import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import Input from "@/components/shared/Input";
import {
  CreatePurchaseOrderItemDto,
  DisplayPOItemsSupplier,
} from "@/dtos/purchase.dto";
import { ItemInterface } from "@/types/items";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { mutate } from "swr";

interface AddItemToPoSupplierProps {
  supplier: DisplayPOItemsSupplier | null;
  poId: number;
  onSubmit: (data: CreatePurchaseOrderItemDto) => Promise<boolean>;
}

const AddItemToPoSupplier = ({
  supplier,
  poId,
  onSubmit,
}: AddItemToPoSupplierProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [clearSignal, setClearSignal] = useState(0);
  const [form, setForm] = useState<CreatePurchaseOrderItemDto>({
    poId: poId,
    itemId: 0,
    poItemOrderedQty: 0,
    poItemReceivedQty: 0,
    unitPrice: 0,
    suppId: supplier?.suppId,
    poItemStatus: "sent",
  });
  const handleItemChange = handleChange(form, setForm);
  const handleSubmit = async () => {
    if (form.itemId === 0) {
      toast.error("Select item first!");
      return;
    }
    setIsAdding(true);
    try {
      const success = await onSubmit(form);
      if (success) {
        setClearSignal((prev) => prev + 1);
        setForm({
          poId: poId,
          itemId: 0,
          poItemOrderedQty: 0,
          poItemReceivedQty: 0,
          unitPrice: 0,
          suppId: supplier?.suppId,
          poItemStatus: "sent",
        });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsAdding(false);
    }
  };
  return (
    <div className="flex flex-col h-full gap-2">
      {" "}
      <span className="text-sm mb-5">
        <span className="font-semibold">Note:</span> Search and add item for
        suppliers PO.
      </span>
      <div className="flex gap-2 mb-5">
        <DropDownSearchItem
          label="Item"
          clearSignal={clearSignal}
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
      <div className="flex justify-end gap-4">
        <div>
          <Button
            label="Cancel"
            size="sm"
            color="secondary"
            disabled={isAdding}
          />
        </div>
        <div>
          <Button
            label="Add Item"
            size="sm"
            onClick={handleSubmit}
            loading={isAdding}
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemToPoSupplier;
