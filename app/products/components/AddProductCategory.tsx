import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import {
  CreateProductCategoryDto,
  CreateProductDtos,
} from "@/dtos/products.dto";
import { UserAuth } from "@/hooks/useSession";
import { ProductCategories } from "@/types/products";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddProductCategoryProps {
  onSubmit: (data: CreateProductCategoryDto) => Promise<boolean>;
  storeId: number;
  user?: UserAuth | null;
  onCancel: () => void;

}
const AddProductCategory = ({
  onSubmit,
  storeId,
  user,
  onCancel,
}: AddProductCategoryProps) => {
  const [form, setForm] = useState<CreateProductCategoryDto>({
    prodCatCreatedBy: user?.userId ?? 0,
    prodCatName: "",
    storeId: storeId,
  });
  const handleFormChange = handleChange(form, setForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (form.storeId === 0 || !form.storeId) {
      toast.error("No store is found!");
      return;
    }
    if (form.prodCatCreatedBy === 0 || !form.prodCatCreatedBy) {
      toast.error("No user is found!");
      return;
    }
    if (form.prodCatName === "") {
      toast.error("Name is required!");
      return;
    }
    try {
      setIsSubmitting(true);
      const success = await onSubmit(form);
      if (success) {
        setForm({
          prodCatCreatedBy: user?.userId ?? 0,
          prodCatName: "",
          storeId: storeId,
        });
      }
    } catch (e) {
    } finally {
      setIsSubmitting(false);
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
            onChange={handleFormChange}
            value={form.prodCatName}
            name="prodCatName"
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
          label="Add Category"
          size="sm"
          className="font-semibold"
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default AddProductCategory;
