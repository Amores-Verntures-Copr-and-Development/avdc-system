import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import { categoryTypeOptions } from "@/constants/dropdown-options";
import { CreateCategoryDto } from "@/dtos/category.dto";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";

interface AddCategoryModalProps {
  onCancel: () => void;
  onSubmit: (data: CreateCategoryDto) => Promise<boolean>;
}
const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [categoryForm, setCategoryForm] = useState<CreateCategoryDto>({
    categoryName: "",
    categoryType: null,
    categoryCreatedBy: 1,
    categoryReferenceId: 0,
    categoryReferenceType: null,
  });
  const handleAddCategory = async () => {
    const success = await onSubmit(categoryForm);
    if (success) {
      onCancel();
    }
  };
  const handleCategoryChage = handleChange(categoryForm, setCategoryForm);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-5">
        {" "}
        <Input
          label={"Name"}
          sizes="sm"
          value={categoryForm.categoryName ?? ""}
          name="categoryName"
          onChange={handleCategoryChage}
        />
        <DropdownSelect
          label="Type"
          value={categoryForm.categoryType ?? ""}
          name="categoryType"
          onChange={handleCategoryChage}
          sizes="sm"
          options={categoryTypeOptions}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <div>
          <Button
            size="md"
            className="text-sm font-semibold"
            color="nocolor"
            label="Cancel"
            onClick={onCancel}
          />
        </div>
        <div>
          {" "}
          <Button
            size="md"
            label="Add Category"
            className="text-sm font-semibold"
            onClick={handleAddCategory}
          />
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;
