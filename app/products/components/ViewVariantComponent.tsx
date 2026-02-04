import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Toggle from "@/components/shared/Toggle";
import { DisplayVariantComponents } from "@/dtos/products.dto";
import { VariantComponents } from "@/types/products";
import { handleChange } from "@/utils/handle-change";
import { Edit, X } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface ViewVariantComponentProps {
  data: DisplayVariantComponents | null;
  onClose: () => void;
  mutate: () => void;
  storeId: number;
  prodId: number;
}

const ViewVariantComponent = ({
  data,
  onClose,
  mutate,
  storeId,
  prodId,
}: ViewVariantComponentProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<VariantComponents>({
    varComId: Number(data?.varComId),
    quantityRequired: Number(data?.quantityRequired),
    isDeductVar: Boolean(data?.isDeductVar),
    inventoryItemId: Number(data?.inventoryItemId),
    prodVarId: Number(data?.prodVarId),
  });
  const change = handleChange(form, setForm);
  const handleUpdateVariantComponents = async () => {
    setIsSaving(true);
    try {
      const result = await fetch(
        `/api/products/${storeId}/product-variants/${prodId}/${data?.prodVarId}/variant-component/${form.varComId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "PUT",
          body: JSON.stringify(form),
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success(res.message);
      mutate();
      onClose();
    } catch (e: any) {
      toast.error(e.error);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase">ID</span>
          <span className="text-sm font-semibold text-gray-800">
            #{data?.varComId}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase">Name</span>
          <span className="text-sm font-semibold text-gray-800">
            {data?.itemName}
          </span>
        </div>
      </div>
      {!isEdit ? (
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase">
              Quantity Required
            </span>
            <span className="text-sm font-semibold text-gray-800">
              {data?.quantityRequired}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase">
              Is Deduct From Inventory ?
            </span>
            <span className="text-sm font-semibold text-gray-800">
              {Boolean(data?.isDeductVar) === true ? "Yes" : "No"}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase">
              Quantity Required
            </span>
            <Input
              label={""}
              sizes={"sm"}
              name="quantityRequired"
              value={form.quantityRequired}
              onChange={change}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-400 uppercase">
              Is Deduct From Inventory ?
            </span>
            <Toggle
              sizes="sm"
              initial={form.isDeductVar}
              onToggle={(state) => {
                setForm((prev) => ({
                  ...prev,
                  isDeductVar: state,
                }));
              }}
            />
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        {!isEdit ? (
          <div>
            <Button
              label="Close"
              icon={X}
              color="secondary"
              size="sm"
              onClick={onClose}
            />
          </div>
        ) : (
          <div>
            <Button
              label="Cancel"
              icon={X}
              color="secondary"
              size="sm"
              onClick={() => {
                setIsEdit(false);
              }}
            />
          </div>
        )}
        {!isEdit ? (
          <div>
            <Button
              label="Edit"
              icon={Edit}
              size="sm"
              onClick={() => {
                setIsEdit(true);
              }}
              disabled={isSaving}
            />
          </div>
        ) : (
          <div>
            <Button
              label="Save"
              icon={Edit}
              size="sm"
              onClick={() => {
                handleUpdateVariantComponents();
              }}
              loading={isSaving}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewVariantComponent;
