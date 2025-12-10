import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/TextArea";
import { CreateStoreDto } from "@/dtos/store.dto";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
interface AddStoreModalProps {
  onCancel: () => void;
  onSubmit: (data: CreateStoreDto) => Promise<boolean>;
}
const AddStoreModal: React.FC<AddStoreModalProps> = ({
  onCancel,
  onSubmit,
}) => {
  const [storeFormData, setStoreFormData] = useState<CreateStoreDto>({
    storeCreatedBy: 1,
    storeName: "",
    storeDescription: "",
    storeLocation: "",
  });
  const handleAddStore = async () => {
    const success = await onSubmit(storeFormData);
    if (success) {
      onCancel();
    }
  };
  const handleStoreChange = handleChange(storeFormData, setStoreFormData);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Input
          label={"Name"}
          name="storeName"
          value={storeFormData.storeName}
          sizes={"xs"}
          onChange={handleStoreChange}
        />
        <Input
          name="storeLocation"
          value={storeFormData.storeLocation ?? ""}
          label={"Location"}
          sizes={"xs"}
          onChange={handleStoreChange}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Textarea
          name="storeDescription"
          value={storeFormData.storeDescription ?? ""}
          label={"Description"}
          sizes="xs"
          onChange={handleStoreChange}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <div>
          <Button
            size="md"
            className="text-sm font-semibold"
            color="secondary"
            label="Cancel"
            onClick={onCancel}
          />
        </div>
        <div>
          {" "}
          <Button
            size="md"
            label="Add Store"
            className="text-sm font-semibold"
            onClick={handleAddStore}
          />
        </div>
      </div>
    </div>
  );
};

export default AddStoreModal;
