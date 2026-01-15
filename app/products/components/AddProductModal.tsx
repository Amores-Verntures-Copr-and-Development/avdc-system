import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";

import Input from "@/components/shared/Input";

import { CreateProductDtos } from "@/dtos/products.dto";
import { UserAuth } from "@/hooks/useSession";

import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddProductModalProps {
  user?: UserAuth | null;
  storeId: number;
  mutate?: () => void;
  onSubmit: (data: CreateProductDtos) => Promise<boolean>;
  isSubmitting?: boolean;
  onCancel: () => void;
}

const AddProductModal = ({
  user,
  storeId,
  mutate,
  onSubmit,
  isSubmitting,
  onCancel,
}: AddProductModalProps) => {
  const [formData, setFormData] = useState<CreateProductDtos>({
    prodCatId: null,
    storeId: storeId,
    prodCreatedBy: user?.userId ?? 0,
    prodName: "",
  });
  const handleDataChange = handleChange(formData, setFormData);
  const handleAddProduct = async () => {
    if (formData.prodName === "") {
      toast.error("No product name is found!");
      return;
    }
    const success = await onSubmit(formData);

    if (success) {
      if (mutate) {
        mutate();
        setFormData({
          prodCatId: null,
          storeId: storeId,
          prodCreatedBy: user?.userId ?? 0,
          prodName: "",
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
            value={formData.prodName}
            name="prodName"
          />
          <DropdownSelect
            label="Category"
            name={"Category"}
            value={undefined}
            options={[]}
            sizes={"sm"}
            onChange={handleDataChange}
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
          onClick={onCancel}
        />
        <Button
          label="Add Product"
          size="sm"
          className="font-semibold"
          onClick={handleAddProduct}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default AddProductModal;
