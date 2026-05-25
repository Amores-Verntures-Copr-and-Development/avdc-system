import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import { CategoryInterface } from "@/types/categories";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface EditCategoryModalProps {
  data: CategoryInterface | null;
  mutate: () => void;
  onCancel: () => void;
}

const EditCategoryModal = ({
  data,
  mutate,
  onCancel,
}: EditCategoryModalProps) => {
  const [form, setForm] = useState<CategoryInterface>({
    ...data,
  } as CategoryInterface);
  const [isUpdating, setIsUpdating] = useState(false);
  const handleSubmit = async () => {
    try {
      setIsUpdating(true);
      const res = await fetch(
        `/api/categories/stores/${form.categoryReferenceId}/${form.categoryId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to update category");
      }
      toast.success("Category updated successfully!");
      mutate();
      onCancel();
    } catch (error) {
      toast.error("Failed to update category!");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-bold">ID: {form.categoryId}</h1>
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2">
        <Input
          label={"Name"}
          value={form.categoryName}
          sizes="sm"
          onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
          name={"categoryName"}
        />
        <DropdownSelect
          label={"Type"}
          sizes="sm"
          value={form.categoryType ?? undefined}
          options={[
            { label: "Product", value: "product" },
            { label: "Item", value: "item" },
            { label: "Services", value: "services" },
          ]}
          onChange={(e) =>
            setForm({
              ...form,
              categoryType: e.target.value as CategoryInterface["categoryType"],
            })
          }
          name={"categoryType"}
        />
      </div>
      <div className="flex justify-end gap-2">
        <div>
          <Button
            label="Cancel"
            size="sm"
            color="secondary"
            disabled={isUpdating}
            onClick={onCancel}
          />
        </div>
        <div>
          <Button
            label="Save Changes"
            size="sm"
            onClick={handleSubmit}
            loading={isUpdating}
          />
        </div>
      </div>
    </div>
  );
};

export default EditCategoryModal;
