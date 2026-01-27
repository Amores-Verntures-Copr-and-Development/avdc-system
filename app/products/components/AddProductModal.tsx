import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";

import Input from "@/components/shared/Input";

import { CreateProductDtos } from "@/dtos/products.dto";
import { UserAuth } from "@/hooks/useSession";
import { ProductCategories } from "@/types/products";

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
  categories: ProductCategories[];
}

const AddProductModal = ({
  user,
  storeId,
  mutate,
  onSubmit,
  isSubmitting,
  onCancel,
  categories,
}: AddProductModalProps) => {
  const [formData, setFormData] = useState<CreateProductDtos>({
    prodCatId: 0,
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
            name={"prodCatId"}
            value={String(formData.prodCatId)}
            options={[
              { value: "", label: "Select a category" }, // default option
              ...categories.map((cat) => ({
                value: String(cat.prodCatId),
                label: cat.prodCatName,
              })),
            ]}
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
