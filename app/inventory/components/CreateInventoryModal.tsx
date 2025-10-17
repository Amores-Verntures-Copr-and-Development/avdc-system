import Button from "@/components/shared/Button";
import DropDownSelectCategory from "@/components/shared/DropDownSelectCategory";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/TextArea";
import { CreateInventoryDto } from "@/dtos/inventory.dto";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";

interface CreateInventoryModalProps {
  onCancel: () => void;
  onSubmit: (data: CreateInventoryDto) => Promise<boolean>;
}
const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({
  onCancel,
  onSubmit,
}) => {
  const [inventoryForm, setInventoryForm] = useState<CreateInventoryDto>({
    inventoryDescription: "",
    inventoryCreatedBy: 0,
    storeId: null,
  });
  const handleInventoryChange = handleChange(inventoryForm, setInventoryForm);
  const handleSubmit = async () => {
    const success = await onSubmit(inventoryForm);
    if (success) {
      onCancel();
    }
  };
  return (
    <div className="space-y-2 w-full">
      <div className="flex flex-wrap gap-4">
        <Textarea
          label={"Description"}
          sizes="sm"
          name={"inventoryDescription"}
          value={inventoryForm.inventoryDescription}
          onChange={handleInventoryChange}
        />
      </div>

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
            label="Create Inventory"
            size="sm"
            onClick={handleSubmit}
            className="font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default CreateInventoryModal;
