import Button from "@/components/shared/Button";
import { CategoryInterface } from "@/types/categories";
import React, { useState } from "react";
import toast from "react-hot-toast";
interface DeleteCategoryModalProps {
  data: CategoryInterface | null;
  mutate: () => void;
  onCancel: () => void;
}

const DeleteCategoryModal = ({
  data,
  mutate,
  onCancel,
}: DeleteCategoryModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/categories/stores/${data?.categoryReferenceId}/${data?.categoryId}`,
        {
          method: "DELETE",
        },
      );
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to delete category");
      }
      toast.success("Category deleted successfully!");
      mutate(); // Refresh the categories list after deletion
      onCancel(); // Close the modal
    } catch (err: any) {
      console.error("Error deleting category:", err);
      // Optionally, show an error toast here
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p>
          Are you sure you want to delete the category{" "}
          <span className="font-bold">{data?.categoryName}</span>?
        </p>
      </div>
      <div className="flex gap-2 justify-end">
        <div>
          <Button
            label="Cancel"
            onClick={onCancel}
            color="secondary"
            size="sm"
          />
        </div>
        <div>
          <Button
            label="Delete"
            onClick={handleDelete}
            color="danger"
            size="sm"
            loading={isDeleting}
          />
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryModal;
