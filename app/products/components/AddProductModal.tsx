import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import DropdownSelect from "@/components/shared/DropdownSelect";
import DropDownSelectCategory from "@/components/shared/DropDownSelectCategory";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/TextArea";
import { ItemInterface } from "@/types/items";
import React, { useState } from "react";

const AddProductModal = () => {
  const [selection, setSelection] = useState<"inventory" | "new">("new");

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-sm font-semibold">
        Choose an item from your inventory to add as a product, or create a new
        one.
      </span>
      <div className="flex gap-2">
        <div>
          <Button
            size="xs"
            label="New"
            color={selection === "new" ? "primary" : "secondary"}
            onClick={() => {
              setSelection("new");
            }}
          />
        </div>
        <div>
          <Button
            size="xs"
            label="Inventory"
            color={selection === "inventory" ? "primary" : "secondary"}
            onClick={() => {
              setSelection("inventory");
            }}
          />
        </div>
      </div>
      {selection === "new" && (
        <>
          <div className="flex flex-wrap gap-4">
            <Input
              label={"Name"}
              name="itemName"
              sizes="xs"
              //   onChange={handleItemChange}
              //   value={inventoryForm.itemName}
            />
            <DropDownSelectCategory
              categoryType="item"
              name={"categoryId"}
              sizes="xs"
              label="Category"
              value={undefined}
              referenceType={null} //   value={`${inventoryForm.categoryId}`}
              //   onChange={handleItemChange}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <DropdownSelect
              label={"Unit"}
              name="itemUnit"
              sizes="xs"
              //   onChange={handleItemChange}
              //   value={inventoryForm.itemUnit}
              //   options={unitOptions}
              value={undefined}
              options={[]}
            />
            <Input
              label={"Price"}
              type="number"
              name="itemPrice"
              sizes="xs"
              //   onChange={handleItemChange}
              //   value={inventoryForm.itemPrice}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <Textarea
              label={"Description"}
              name="itemDescription"
              sizes="xs"
              //   onChange={handleItemChange}
              //   value={inventoryForm.itemDescription ?? ""}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <Input
              label={"Quantity"}
              type="number"
              name="inventoryItemQuantity"
              sizes="xs"
              //   onChange={handleItemChange}
              //   value={inventoryForm.inventoryItemQuantity}
            />
            <Input
              label={"Minimum Stock"}
              sizes="xs"
              type="number"
              //   onChange={handleItemChange}
              //   value={inventoryForm.inventoryItemMin}
              name="inventoryItemMin"
            />
          </div>
        </>
      )}
      {selection === "inventory" && (
        <>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-4">
              {" "}
              <DropDownSearchItem
                sizes="xs"
                onSelect={function (item: ItemInterface): void {
                  console.log(item);
                }}
                label="Search item"
              />{" "}
              <Input label={"Price"} sizes={"xs"} />
            </div>
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
            // onClick={onCancel}
            className="font-semibold"
          />
        </div>
        <div>
          {" "}
          <Button
            label="Add Item"
            size="sm"
            // onClick={handleSubmit}
            className="font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
