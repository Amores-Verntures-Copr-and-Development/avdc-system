import Button from "@/components/shared/Button";

import Input from "@/components/shared/Input";
import SearchInventoryItem from "@/components/shared/SearchInventoryItem";

import { CreateRequestItemDto } from "@/dtos/request.dto";

import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";

interface AddItemROModalProps {
  inventoryId: number;
  requestId: number;
  requestInventoryItem: number[];
  onSubmit: (data: CreateRequestItemDto) => Promise<boolean>;
  mutate: () => void;
  loading: boolean;
  onClose: () => void;
}
const AddItemROModal = ({
  requestId,
  inventoryId,
  requestInventoryItem,
  onSubmit,
  mutate,
  loading,
  onClose,
}: AddItemROModalProps) => {
  const handleAddItemRequest = async (data: CreateRequestItemDto) => {
    console.log({ data });
    const success = await onSubmit(data);
    if (success) {
      setFormData({
        reqItemQuantity: 0,
        requestId: requestId,
        invItem: 0,
        reqItemStatus: "pending",
      });
      mutate();
    }
  };
  const [formatData, setFormData] = useState<CreateRequestItemDto>({
    reqItemQuantity: 0,
    requestId: requestId,
    invItem: 0,
    reqItemStatus: "pending",
  });
  const handleItemChange = handleChange(formatData, setFormData);
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xs">
        Search item from inventory to add in your request.
      </h1>
      <div className="flex flex-col gap-5 p-4 shadow border border-gray-300 rounded">
        <div className="flex justify-end"></div>
        <div>
          <SearchInventoryItem
            label="Item"
            sizes="xs"
            onSelect={(item) => {
              if (item) {
                setFormData((prev) => ({
                  ...prev,
                  invItem: item.inventoryItemId,
                  unitPrice: item.itemPrice,
                }));
              } else {
                setFormData((prev) => ({
                  ...prev,
                  invItem: 0,
                }));
              }
            }}
            inventoryId={inventoryId}
          />
          {formatData.invItem !== 0 &&
            (requestInventoryItem.includes(formatData.invItem) ? (
              <span className="text-red-500 text-xs">
                Item already in request
              </span>
            ) : (
              <span className="text-green-700 text-xs">
                Item can be added to request
              </span>
            ))}
        </div>
        <div>
          <Input
            disabled={requestInventoryItem.includes(formatData.invItem)}
            label={"Quantity"}
            onChange={handleItemChange}
            name="reqItemQuantity"
            value={formatData.reqItemQuantity}
            type="number"
            sizes="xs"
          />
        </div>
      </div>
      <div className="flex justify-center gap-3">
        <div>
          <Button
            label="Cancel"
            size="sm"
            color="secondary"
            onClick={onClose}
            disabled={
              requestInventoryItem.includes(formatData.invItem) || loading
            }
          />
        </div>
        <div>
          <Button
            label="Add"
            size="sm"
            onClick={() => {
              handleAddItemRequest(formatData);
            }}
            loading={loading}
            disabled={requestInventoryItem.includes(formatData.invItem)}
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemROModal;
