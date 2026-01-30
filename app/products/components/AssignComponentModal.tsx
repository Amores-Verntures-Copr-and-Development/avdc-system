import Button from "@/components/shared/Button";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import Input from "@/components/shared/Input";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { CreateVarianComponentDto } from "@/dtos/products.dto";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AssignComponentModalProps {
  storeId: number;
  prodId: number;
  prodVarId: number;
  onClose: () => void;
  mutate: () => void;
}

const AssignComponentModal = ({
  storeId,
  prodId,
  prodVarId,
  onClose,
  mutate,
}: AssignComponentModalProps) => {
  // const {} = useInventoryItems({ id:2, search:, reference: "storeId" });
  const searchItems = async (
    query: string,
  ): Promise<DisplayInventoryItems[]> => {
    const res = await fetch(
      `api/inventory/store/${storeId}/item?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data.data || [];
  };
  const [formData, setFormData] = useState<CreateVarianComponentDto>({
    prodVarId: prodVarId,
    inventoryItemId: 0,
    quantityRequired: 0,
  });
  const handleChangeForm = handleChange(formData, setFormData);
  const handleAssignVariant = async () => {
    console.log({ formData });
    try {
      const result = await fetch(
        `/api/products/${storeId}/product-variants/${prodId}/${prodVarId}/variant-component/`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify([formData]),
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success(res.message);
      mutate();
      onClose();
    } catch (e: any) {
      toast.error(e.error);
    }
  };
  return (
    <div className="flex flex-col gap-2 h-full bg-white p-2 rounded">
      <div className="flex gap-2">
        <DropdownSearch<DisplayInventoryItems>
          searchFn={searchItems}
          onSelect={(item) => {
            setFormData((prev) => ({
              ...prev,
              inventoryItemId: item.inventoryItemId,
            }));
          }}
          renderItem={(item) => (
            <span>
              <span className="font-semibold">{item.itemName}</span>{" "}
              {item.itemUnit} ({item.inventoryItemQuantity}) qty
            </span>
          )}
          displayValue={(item) => `${item.itemName} ${item.itemUnit} `}
          label="Search Inventory Item"
          sizes="sm"
        />
        <Input
          label={"Required Quantity"}
          value={formData.quantityRequired || ""}
          sizes="sm"
          onChange={handleChangeForm}
          name="quantityRequired"
        />
      </div>
      <div className="flex mt-auto justify-end gap-3">
        <div>
          <Button size="sm" label="Cancel" color="outline" />
        </div>{" "}
        <div>
          <Button size="sm" label="Assign" onClick={handleAssignVariant} />
        </div>
      </div>
    </div>
  );
};

export default AssignComponentModal;
