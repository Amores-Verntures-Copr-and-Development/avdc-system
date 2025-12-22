import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import Input from "@/components/shared/Input";
import { DisplayRequisitionWithItems } from "@/dtos/purchase.dto";
import { ItemInterface } from "@/types/items";
import React from "react";

interface AddItemToRequestModalProps {
  data: DisplayRequisitionWithItems | null;
}
const AddItemToRequestModal = ({ data }: AddItemToRequestModalProps) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs xl:text-sm font-semibold">
        Note:
        <span className="font-normal">
          {" "}
          Adding an item to this request will also add it to the purchase order.
          If the item already exists in the purchase order, it will not be
          duplicated.
        </span>
      </span>
      <div className="flex  gap-2">
        <DropDownSearchItem
          label="Search Item"
          onSelect={function (item: ItemInterface): void {
            throw new Error("Function not implemented.");
          }}
          sizes="xs"
        />
        <Input label={"Quantity"} sizes="xs" />
      </div>
      <div className="flex justify-end gap-2">
        <div>
          <Button label="Cancel" size="sm" color="secondary" hasBorder />
        </div>
        <div>
          <Button label="Add Item" size="sm" hasBorder />
        </div>
      </div>
    </div>
  );
};

export default AddItemToRequestModal;
