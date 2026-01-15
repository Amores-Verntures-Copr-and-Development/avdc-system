import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import Input from "@/components/shared/Input";
import { DisplayRequisitionWithItems } from "@/dtos/purchase.dto";
import { CreateRequestItemDto } from "@/dtos/request.dto";
import { ItemInterface } from "@/types/items";
import React, { useState } from "react";

interface AddItemToRequestModalProps {
  data: DisplayRequisitionWithItems | null;
  onCancel: () => void;
}
const AddItemToRequestModal = ({
  onCancel,
  data,
}: AddItemToRequestModalProps) => {
  const [itemForm, seItemForm] = useState<CreateRequestItemDto>({
    requestId: data?.requestId ?? 0,
    reqItemQuantity: 0,
    invItem: 0,
  });
  const handleAddItemInRequest = async () => {
    console.log({ data });
  };
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
            console.log(item);
          }}
          sizes="xs"
        />
        <Input label={"Quantity"} sizes="xs" />
      </div>
      <div className="flex justify-end gap-2">
        <div>
          <Button
            label="Cancel"
            size="sm"
            color="secondary"
            hasBorder
            onClick={onCancel}
          />
        </div>
        <div>
          <Button
            label="Add Item"
            size="sm"
            hasBorder
            onClick={handleAddItemInRequest}
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemToRequestModal;
