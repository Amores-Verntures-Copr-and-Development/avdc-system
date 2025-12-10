import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import Input from "@/components/shared/Input";
import { CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { ItemInterface } from "@/types/items";
import { Supplier } from "@/types/supplier";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";

interface AddItemToSupplierModalProps {
  data: Supplier | null;
  onSubmit: (data: CreateSupplierItemDto) => Promise<boolean>;
  onCancel: () => void;
}

const AddItemToSupplierModal: React.FC<AddItemToSupplierModalProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [itemSupplierForm, setItemSupplierForm] =
    useState<CreateSupplierItemDto>({
      itemId: 0,
      suppItemCreatedBy: 0,
      suppItemPrice: 0,
      suppId: 0,
    });

  const handleChangeSupplierItem = handleChange(
    itemSupplierForm,
    setItemSupplierForm
  );

  const handleAddItemToSupplier = async () => {
    const success = await onSubmit(itemSupplierForm);
    if (success) {
      onCancel();
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-sm text-gray-500">Add item to supplier and price.</h1>

      <div className="grid grid-cols-4 items-center gap-2">
        <label className="text-sm col-span-1 text-gray-700">Item Name:</label>
        <div className="col-span-3">
          <DropDownSearchItem
            onSelect={function (item: ItemInterface): void {
              setItemSupplierForm({
                ...itemSupplierForm,
                itemId: item.itemId,
              });
            }}
            sizes="sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-2">
        <label className="text-sm col-span-1 text-gray-700">Item Price:</label>
        <div className="col-span-3">
          <Input
            label=""
            sizes="xs"
            placeholder="Enter item price"
            name="suppItemPrice"
            value={itemSupplierForm.suppItemPrice}
            onChange={handleChangeSupplierItem}
          />
        </div>
      </div>
      <div className="flex justify-end gap-5">
        <div>
          <Button
            onClick={onCancel}
            size="sm"
            label="Cancel"
            color="secondary"
          />
        </div>
        <div>
          <Button
            onClick={handleAddItemToSupplier}
            size="sm"
            label="Add Item"
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemToSupplierModal;
