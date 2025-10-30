import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import DropDownSelectCategory from "@/components/shared/DropDownSelectCategory";
import Input from "@/components/shared/Input";
import Table from "@/components/shared/Table";
import Textarea from "@/components/shared/TextArea";
import { unitOptions } from "@/constants/dropdown-options";
import {
  CreateFirstItem,
  CreateInventoryWithItemDto,
} from "@/dtos/inventory.dto";
import { UserAuth } from "@/hooks/useSession";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";

interface AddItemModalProps {
  onCancel: () => void;
  onSubmit: (data: CreateFirstItem) => Promise<boolean>;
  user?: UserAuth | null;
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  onCancel,
  onSubmit,
  user,
}) => {
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
            color={selection === "create" ? "primary" : "nocolor"}
            onClick={() => {
              setSelection("create");
            }}
          />
        </div>
        <div>
          <Button
            size="xs"
            label="Warehouse"
            color={selection === "warehouse" ? "primary" : "nocolor"}
            onClick={() => {
              setSelection("warehouse");
            }}
          />
        </div>
      </div>
      {selection === "create" && (
        <>
          <div className="flex flex-wrap gap-4">
            <Input
              label={"Name"}
              name="itemName"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.itemName}
            />
            <DropDownSelectCategory
              categoryType="item"
              name={"categoryId"}
              sizes="xs"
              label="Category"
              value={`${inventoryForm.categoryId}`}
              onChange={handleItemChange}
            />
          </div>
          <div className="flex flex-wrap gap-4">
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
          <div className="flex flex-wrap gap-4">
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
      {selection === "warehouse" && (
        <>
          <div className="flex flex-wrap gap-4">
            <Input
              label={"Name"}
              name="itemName"
              sizes="xs"
              onChange={handleItemChange}
              value={inventoryForm.itemName}
            />
            <DropDownSelectCategory
              categoryType="item"
              name={"categoryId"}
              sizes="xs"
              label="Category"
              value={`${inventoryForm.categoryId}`}
              onChange={handleItemChange}
            />
          </div>
          <div className="flex flex-wrap gap-4">
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
          <div className="flex flex-wrap gap-4">
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
          />
        </div>
        <div>
          {" "}
          <Button
            label="Add Item"
            size="sm"
            onClick={handleSubmit}
            className="font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;

const addItemTable = () => {
  return <Table columns={[]} data={[]} />;
};
