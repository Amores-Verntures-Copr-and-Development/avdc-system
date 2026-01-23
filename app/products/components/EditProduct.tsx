import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { ProductCategories, Products } from "@/types/products";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface EditProductProps {
  data: DisplayProductsDtos | null;
  onClose: () => void;
  mutate: () => void;
  productCategory: ProductCategories[];
}
const EditProduct = ({
  data,
  onClose,
  mutate,
  productCategory,
}: EditProductProps) => {
  const [form, setForm] = useState<Products>({
    prodId: data?.prodId ?? 0,
    prodCatId: data?.prodCatId ?? null,
    prodName: data?.prodName ?? "",
    prodCreatedAt: data?.prodCatCreatedAt ?? "",
    prodDeletedAt: data?.prodCatDeletedAt ?? "",
    prodCreatedBy: data?.prodCreatedBy ?? 0,
    prodUpdatedAt: data?.prodCatUpdatedAt ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const handProductChange = handleChange(form, setForm);
  const handleUpdateProduct = async () => {
    const product: Partial<Products> = {
      prodId: form.prodId,
      prodCatId: Number(form.prodCatId) || null,
      prodName: form.prodName,
    };
    console.log({ data });
    console.log({ product });
    setIsSaving(true);
    try {
      const result = await fetch(
        `/api/products/${data?.storeId}/${product.prodId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(product),
          credentials: "include",
        },
      );

      const res = await result.json();

      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      if (mutate) {
        mutate();
      }
      onClose();
    } catch (e) {
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex">
        <span className="text-xs font-semibold">ID: {data?.prodId}</span>
      </div>
      <div className="flex gap-5">
        <Input
          label={"Name"}
          value={form?.prodName}
          sizes={"xs"}
          onChange={handProductChange}
          name="prodName"
        />
        <DropdownSelect
          label="Category"
          onChange={handProductChange}
          name="prodCatId"
          value={String(form?.prodCatId)}
          options={[
            { label: "Select Categories", value: "" }, // ✅ no filter
            ...productCategory.map((cat) => ({
              label: cat.prodCatName,
              value: String(cat.prodCatId),
            })),
          ]}
          sizes="xs"
        />
      </div>
      <div className="flex mt-auto justify-end gap-4">
        <div>
          <Button
            size="sm"
            label="Cancel"
            color="outline"
            disabled={isSaving}
            onClick={onClose}
          />
        </div>
        <div>
          <Button
            size="sm"
            label="Save"
            onClick={handleUpdateProduct}
            loading={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
