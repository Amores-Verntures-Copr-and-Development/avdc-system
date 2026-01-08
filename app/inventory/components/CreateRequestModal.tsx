import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import {
  CreateRequestFormDto,
  InsertItemsRequestDto,
} from "@/dtos/request.dto";
import { UserAuth } from "@/hooks/useSession";

import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
interface CreateRequestModalProps {
  data: DisplayInventoryItems[];
  onCancel: () => void;
  onSubmit: (items: CreateRequestFormDto) => Promise<boolean>;
  user?: UserAuth | null;
}
interface EditableItem {
  invItem: number;
  reqItemQuantity: string; // string for input
  requestId: number;
  itemName: string;
  itemUnit: string;
  categoryName: string;
  inventoryItemQuantity: number;
}

const columns: Column<EditableItem>[] = [
  { name: "ID", key: "#", selector: (_row, index) => index + 1 },
  { name: "Item Name", key: "itemName" },
  { name: "Unit", key: "itemUnit" },
  { name: "Category", key: "categoryName" },
  { name: "Stock Available", key: "inventoryItemQuantity" },
  {
    name: "Request Quantity",
    key: "reqItemQuantity",
    inputType: "number",
    editable: true,
  },
];

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  data,
  user,
  onCancel,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updatedItemsRef = useRef<EditableItem[]>([]);
  const handleDataUpdate = (updatedData: EditableItem[]) => {
    updatedItemsRef.current = updatedData; // Store without causing re-render
  };
  const newData = {
    requestById: user?.userId ?? 0,
    requestOrderId: "",
    storeId: user?.storeId ?? 0,
    items: data.map((items) => ({
      invItem: items.inventoryItemId,
      reqItemQuantity: "",
      requestId: 0,
      itemName: items.itemName,
      itemUnit: items.itemUnit,
      categoryName: items.categoryName,
      inventoryItemQuantity: items.inventoryItemQuantity,
    })),
  };

  const handleSubmit = async () => {
    console.log("User: ", user);

    const updatedItems = updatedItemsRef.current;
    const hasZeroQuantity = updatedItems.some(
      (item) => Number(item.reqItemQuantity) <= 0 || item.reqItemQuantity === ""
    );
    if (hasZeroQuantity) {
      toast.error("Please enter a valid quantity for all items.");
      return;
    }
    setIsSubmitting(true);
    try {
      const newItems: InsertItemsRequestDto[] = updatedItems.map((items) => ({
        ...items,
        reqItemQuantity: Number(items.reqItemQuantity),
      }));
      const requestData: CreateRequestFormDto = {
        storeId: user?.storeId ?? 0,
        requestById: user?.userId ?? 0,
        requestNo: "",
        items: newItems,
      };
      const success = await onSubmit(requestData);
      if (success) {
        onCancel();
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("An error occurred while submitting the request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Table
        uniqueIdKey="invItem"
        columns={columns}
        data={newData.items}
        updateData={handleDataUpdate}
      />
      <div className="flex justify-end gap-2 mt-10">
        <div>
          <Button
            label="Cancel"
            color="secondary"
            size="sm"
            onClick={onCancel}
            className="font-semibold"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Button
            label="Submit Request"
            size="sm"
            onClick={handleSubmit}
            className="font-semibold"
            loading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateRequestModal;
