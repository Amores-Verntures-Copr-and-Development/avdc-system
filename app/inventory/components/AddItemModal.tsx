import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import DropDownSelectCategory from "@/components/shared/DropDownSelectCategory";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/TextArea";
import { unitOptions } from "@/constants/dropdown-options";
import { CreateFirstItem } from "@/dtos/inventory.dto";
import { UserAuth } from "@/hooks/useSession";
import { useStockRoom } from "@/hooks/useStockRoom";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddItemModalProps {
  onCancel: () => void;
  onSubmit: (data: CreateFirstItem) => Promise<boolean>;
  user?: UserAuth | null;
  loading?: boolean;
  isAdmin: boolean;
  hasStore: boolean;
  inventoryType: "stores" | "stock-room" | "inventoryId";
  inventoryId: number;
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  onCancel,
  onSubmit,
  user,
  loading,
  inventoryId,
  // isAdmin,
  // hasStore,
  inventoryType,
}) => {
  const isUserStores = user?.storeId !== null;
  const [selection, setSelection] = useState<"create" | "warehouse">("create");
  const [inventoryForm, setInventoryForm] = useState<CreateFirstItem>({
    inventoryId: 0,
    inventoryItemCreatedBy: 0,
    itemAddedBy: 0,
    itemName: "",
    itemPrice: 0,
    itemUnit: "",
    itemDescription: "",
    inventoryItemMin: 0,
    inventoryItemQuantity: 0,
    inventoryItemReferenceType: "item",
    inventoryItemReferenceId: 0,
    categoryId: 0,
  });
  const handleItemChange = handleChange(inventoryForm, setInventoryForm);
  const handleSubmit = async () => {
    if (!inventoryForm.itemName || inventoryForm.itemName.trim() === "") {
      toast.error("Item name is required");
      return;
    }
    if (!inventoryForm.categoryId || inventoryForm.categoryId === 0) {
      toast.error("Category is required");
      return;
    }
    if (inventoryForm.itemUnit.trim() === "") {
      toast.error("Item unit is required");
      return;
    }
    const success = await onSubmit(inventoryForm);
    if (success) {
      onCancel();
    }
  };
  return (
    <div className="space-y-2 w-full">
      <div className="flex gap-2">
        <div>
          <Button
            size="xs"
            label="Create New Item"
            color={selection === "create" ? "primary" : "secondary"}
            onClick={() => {
              setSelection("create");
            }}
          />
        </div>
        <div>
          <Button
            size="xs"
            label="Warehouse"
            color={selection === "warehouse" ? "primary" : "secondary"}
            onClick={() => {
              setSelection("warehouse");
            }}
          />
        </div>
      </div>
      {selection === "create" && (
        <>
          <div className="flex flex-col 2xl:flex-row gap-4">
            <Input
              label={"Name"}
              name="itemName"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.itemName}
            />
            <DropDownSelectCategory
              referenceType={isUserStores ? "stores" : "stock-room"}
              id={inventoryId ?? 0}
              categoryType="item"
              name={"categoryId"}
              sizes="xs"
              label="Category"
              value={`${inventoryForm.categoryId}`}
              onChange={handleItemChange}
            />
          </div>
          <div className="flex flex-col 2xl:flex-row gap-4">
            <DropdownSelect
              label={"Unit"}
              name="itemUnit"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.itemUnit}
              options={unitOptions}
            />
            <Input
              label={"Price"}
              type="number"
              name="itemPrice"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.itemPrice}
            />
          </div>
          <div className="flex flex-col 2xl:flex-row gap-4">
            <Textarea
              label={"Description"}
              name="itemDescription"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.itemDescription ?? ""}
            />
          </div>
          <div className="flex flex-col 2xl:flex-row gap-4">
            <Input
              label={"Quantity"}
              type="number"
              name="inventoryItemQuantity"
              sizes="xs"
              onChange={handleItemChange}
              value={
                inventoryForm.inventoryItemQuantity === 0
                  ? ""
                  : inventoryForm.inventoryItemQuantity
              }
            />
            <Input
              label={"Minimum Stock"}
              sizes="xs"
              type="number"
              onChange={handleItemChange}
              value={
                inventoryForm.inventoryItemMin === 0
                  ? ""
                  : inventoryForm.inventoryItemMin
              }
              name="inventoryItemMin"
            />
          </div>
        </>
      )}
      {selection === "warehouse" && (
        <>
          <div className="flex flex-col 2xl:flex-row gap-4">
            <Input
              label={"Name"}
              name="itemName"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.itemName}
            />
            <DropDownSelectCategory
              id={inventoryId}
              referenceType={inventoryType}
              categoryType="item"
              name={"categoryId"}
              sizes="xs"
              label="Category"
              value={`${inventoryForm.categoryId}`}
              onChange={handleItemChange}
            />
          </div>
          <div className="flex flex-col 2xl:flex-row gap-4">
            <DropdownSelect
              label={"Unit"}
              name="itemUnit"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.itemUnit}
              options={unitOptions}
            />
            <Input
              label={"Price"}
              type="number"
              name="itemPrice"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.itemPrice}
            />
          </div>
          <div className="flex flex-col 2xl:flex-row gap-4">
            <Textarea
              label={"Description"}
              name="itemDescription"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.itemDescription ?? ""}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <Input
              label={"Quantity"}
              type="number"
              name="inventoryItemQuantity"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.inventoryItemQuantity}
            />
            <Input
              label={"Minimum Stock"}
              sizes="xs"
              type="number"
              onChange={handleItemChange}
              value={inventoryForm.inventoryItemMin}
              name="inventoryItemMin"
            />
          </div>
        </>
      )}
      <div className="flex justify-end gap-2 mt-10">
        <div>
          {" "}
          <Button
            label="Cancel"
            color="secondary"
            size="sm"
            onClick={onCancel}
            className="font-semibold"
            disabled={loading}
          />
        </div>
        <div>
          {" "}
          <Button
            label="Add Item"
            size="sm"
            onClick={handleSubmit}
            className="font-semibold"
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;
