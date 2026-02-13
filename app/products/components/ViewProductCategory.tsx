import Button from "@/components/shared/Button";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import IconButton from "@/components/shared/IconButton";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import { ApiResponse } from "@/types/api";
import { ProductCategories } from "@/types/products";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { handleChange } from "@/utils/handle-change";
import { formatDate } from "date-fns";
import { Pencil, PencilLineIcon, Trash } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import useSWR, { mutate } from "swr";

interface ViewProductCategoryProps {
  storeId: number;
  setShowPopupComponent: React.Dispatch<React.SetStateAction<boolean>>;
  mutateProduct: () => void;
}

const ViewProductCategory = ({
  storeId,
  setShowPopupComponent,
  mutateProduct,
}: ViewProductCategoryProps) => {
  const { data: reponse, mutate } = useSWR<ApiResponse<ProductCategories[]>>(
    storeId ? `/api/products/${storeId}/product-categories/` : null,
    fetcher,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState<"delete" | "edit" | null>(null);
  const [catForm, setCatForm] = useState<ProductCategories | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategories | null>(null);

  const handleOnChangeCat = handleChange(catForm, setCatForm);
  const handleEditCategory = async () => {
    setIsSubmitting(true);
    const modify: Partial<ProductCategories> = {
      prodCatId: catForm?.prodCatId,
      prodCatName: catForm?.prodCatName,
    };
    try {
      const result = await fetch(
        `/api/products/${catForm?.storeId}/product-categories/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([modify]),
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      mutate();
      mutateProduct();
      toast.success(res.message);
      setShowModal(null);
      setShowPopupComponent(false);
      setSelectedCategory(null);
      setCatForm(null);

      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteCategory = async () => {
    setIsSubmitting(true);
    const modify: Partial<ProductCategories> = {
      prodCatId: selectedCategory?.prodCatId,
    };
    try {
      const result = await fetch(
        `/api/products/${selectedCategory?.storeId}/product-categories/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([modify]),
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      mutate();
      mutateProduct();
      toast.success(`${selectedCategory?.prodCatName} deleted successfully!`);
      setShowModal(null);
      setShowPopupComponent(false);
      setSelectedCategory(null);
      setCatForm(null);
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col h-full">
      {reponse?.data &&
        reponse.data.map((cat, index) => (
          <div className="flex justify-between p-2" key={cat.prodCatId}>
            <label className="text-xs">#{index + 1}</label>
            <div className="flex flex-col">
              <label className="text-sm font-semibold">{cat.prodCatName}</label>
              <span className="text-xs text-gray-500">
                {formatDateToWords(cat.prodCatCreatedAt)}
              </span>
            </div>
            <div className="flex">
              <div className="flex justify-center gap-2">
                <IconButton
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowModal("edit");
                    setShowPopupComponent(true);
                    setCatForm(cat);
                  }}
                  label={"Edit"}
                  bg={"green"}
                  icon={<Pencil className="w-3 h-3 xl:w-4 xl:h-4" />}
                />
                <IconButton
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowModal("delete");
                    setShowPopupComponent(true);
                  }}
                  label={"Remove"}
                  bg={"red"}
                  icon={<Trash className="w-3 h-3 xl:w-4 xl:h-4" />}
                />
              </div>
            </div>
          </div>
        ))}

      <Modal
        title="Edit Product Category"
        isOpen={showModal === "edit"}
        onClose={function (): void {
          setShowModal(null);
          setShowPopupComponent(false);
          setSelectedCategory(null);
          setCatForm(null);
        }}
      >
        <div className="grid grid-cols-1 h-full gap-4">
          <div className="flex gap-2">
            <Input
              label={"Category Name"}
              sizes={"sm"}
              value={catForm?.prodCatName}
              onChange={handleOnChangeCat}
              name="prodCatName"
            />
          </div>
          <div className="flex justify-end gap-2 mt-auto">
            <div>
              <Button
                label="Cancel"
                size="sm"
                color="secondary"
                onClick={() => {
                  setShowModal(null);
                  setShowPopupComponent(false);
                  setSelectedCategory(null);
                  setCatForm(null);
                }}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Button
                label="Save"
                size="sm"
                onClick={handleEditCategory}
                loading={isSubmitting}
              />
            </div>
          </div>
        </div>
      </Modal>
      <ConfirmationModal
        onConfirm={handleDeleteCategory}
        confirmationInfo={`Are you sure you want to delete ${selectedCategory?.prodCatName} from Product Category?`}
        onClose={function (): void {
          setShowModal(null);
          setShowPopupComponent(false);
          setSelectedCategory(null);
        }}
        isShow={showModal === "delete"}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default ViewProductCategory;
