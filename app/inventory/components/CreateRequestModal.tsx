import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Table, { Column } from "@/components/shared/Table";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import {
  CreateRequestFormDto,
  InsertItemsRequestDto,
} from "@/dtos/request.dto";
import { UserAuth } from "@/hooks/useSession";
import { Trash } from "lucide-react";

import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
interface CreateRequestModalProps {
  data: DisplayInventoryItems[];
  onCancel: () => void;
  onSubmit: (items: CreateRequestFormDto) => Promise<boolean>;
  user?: UserAuth | null;
  onRemoveItem: (id: number) => void;
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
  onRemoveItem,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableData, setTableData] = useState<EditableItem[]>(() =>
    data.map((items) => ({
      invItem: items.inventoryItemId,
      reqItemQuantity: String(items.reqItemQuantity) ?? "",
      requestId: 0,
      itemName: items.itemName,
      itemUnit: items.itemUnit,
      categoryName: items.categoryName,
      inventoryItemQuantity: items.inventoryItemQuantity,
    })),
  );

  const updatedItemsRef = useRef<EditableItem[]>(tableData);

  const handleDataUpdate = (updatedData: EditableItem[]) => {
    updatedItemsRef.current = updatedData; // Store without causing re-render
    setTableData(updatedData); // Keep UI in sync
  };

  const handleRemoveItem = (id: number) => {
    const filtered = tableData.filter((item) => item.invItem !== id);
    updatedItemsRef.current = filtered; // update ref
    setTableData(filtered);
    onRemoveItem(id); // update UI
  };

  const handleSubmit = async () => {
    const updatedItems = updatedItemsRef.current;

    if (updatedItems.length === 0) {
      toast.error("Please add at least one item to request.");
      return;
    }

    const hasZeroQuantity = updatedItems.some(
      (item) =>
        Number(item.reqItemQuantity) <= 0 || item.reqItemQuantity === "",
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
        reqItemStatus: "pending",
      }));
      const requestData: CreateRequestFormDto = {
        storeId: user?.storeId ?? 0,
        requestById: user?.userId ?? 0,
        requestNo: "",
        items: newItems,
      };
      const success = await onSubmit(requestData);
      if (success) onCancel();
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("An error occurred while submitting the request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 min-h-0">
        <Table
          uniqueIdKey="invItem"
          columns={columns}
          data={tableData}
          showActions
          updateData={handleDataUpdate}
          renderActions={(row) => (
            <div className="flex items-center justify-center">
              <IconButton
                onClick={() => handleRemoveItem(row.invItem)}
                label="Remove"
                bg="red"
                icon={<Trash className="w-3 h-3 xl:w-4 xl:h-4" />}
              />
            </div>
          )}
        />
      </div>
      <div className="flex flex-1 justify-end gap-2">
        <Button
          label="Cancel"
          color="secondary"
          size="sm"
          onClick={onCancel}
          className="font-semibold"
          disabled={isSubmitting}
        />
        <Button
          label="Submit Request"
          size="sm"
          onClick={handleSubmit}
          className="font-semibold"
          loading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default CreateRequestModal;
