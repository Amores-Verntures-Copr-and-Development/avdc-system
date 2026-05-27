import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { CreateProductVariantDto } from "@/dtos/products.dto";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";

interface AddVariantModalProps {
  onSubmit: (data: CreateProductVariantDto) => Promise<boolean>;
  mutate: () => void;
  isSubmitting: boolean;
}
const AddVariantModal = ({
  onSubmit,
  mutate,
  isSubmitting,
}: AddVariantModalProps) => {
  const [formData, setFormData] = useState<CreateProductVariantDto>({
    prodId: 0,
    prodVarCreatedBy: 0,
    prodVarName: "",
    prodVarPrice: 0,
    isDeductInv: false,
    inventoryItemId: null,
  });
  const handleDataChange = handleChange(formData, setFormData);
  const handleAddProduct = async () => {
    const success = await onSubmit(formData);
    if (success) {
      if (mutate) {
        mutate();
        setFormData({
          prodId: 0,
          prodVarCreatedBy: 0,
          prodVarName: "",
          prodVarPrice: 0,
          isDeductInv: false,
          inventoryItemId: null,
        });
      }
    }
  };
  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <span className="text-sm font-semibold"></span>

      <div className="flex flex-col">
        <div className="flex gap-2">
          <Input
            label={"Name"}
            sizes={"sm"}
            onChange={handleDataChange}
            value={formData.prodVarName}
            name="prodVarName"
          />
          <Input
            label={"Price"}
            sizes={"sm"}
            onChange={handleDataChange}
            value={formData.prodVarPrice}
            name="prodVarPrice"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-auto">
        <Button
          label="Cancel"
          color="secondary"
          size="sm"
          className="font-semibold"
          disabled={isSubmitting}
        />
        <Button
          label="Add Variant"
          size="sm"
          className="font-semibold"
          onClick={handleAddProduct}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default AddVariantModal;
