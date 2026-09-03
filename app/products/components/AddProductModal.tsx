import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";

import Input from "@/components/shared/Input";
import Table, { Column } from "@/components/shared/Table";
import Toggle from "@/components/shared/Toggle";

import { CreateProductDtos, CreateProductVariantDto } from "@/dtos/products.dto";
import { UserAuth } from "@/hooks/useSession";
import { ProductCategories } from "@/types/products";

import { handleChange } from "@/utils/handle-change";
import { Plus, Trash2 } from "lucide-react";
import React, { useRef, useState } from "react";
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

interface VariantRow {
  id: number;
  prodVarName: string;
  prodVarPrice: string;
  prodVarUnit: string;
}

const emptyVariantRow = (id: number): VariantRow => ({
  id,
  prodVarName: "",
  prodVarPrice: "",
  prodVarUnit: "",
});

const variantColumns: Column<VariantRow>[] = [
  {
    name: "Variant Name",
    key: "prodVarName",
    editable: true,
    inputType: "text",
  },
  {
    name: "Price",
    key: "prodVarPrice",
    editable: true,
    inputType: "number",
  },
  {
    name: "Unit",
    key: "prodVarUnit",
    editable: true,
    inputType: "text",
    inputProps: { placeholder: "pc" },
  },
];

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
  const [hasVariants, setHasVariants] = useState(false);
  const [variantPrice, setVariantPrice] = useState("");
  const [variantUnit, setVariantUnit] = useState("");
  const [variantRows, setVariantRows] = useState<VariantRow[]>([
    emptyVariantRow(1),
  ]);
  const nextVariantRowId = useRef(2);
  const handleDataChange = handleChange(formData, setFormData);

  const addVariantRow = () => {
    setVariantRows((prev) => [
      ...prev,
      emptyVariantRow(nextVariantRowId.current++),
    ]);
  };

  const removeVariantRow = (id: number) => {
    setVariantRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAddProduct = async () => {
    if (formData.prodName === "") {
      toast.error("No product name is found!");
      return;
    }

    let productVariants: CreateProductVariantDto[];

    if (hasVariants) {
      const validRows = variantRows.filter(
        (row) => row.prodVarName.trim() !== "",
      );

      if (validRows.length === 0) {
        toast.error("Please add at least one variant.");
        return;
      }

      productVariants = validRows.map((row) => ({
        prodId: 0,
        prodVarCreatedBy: user?.userId ?? 0,
        prodVarName: row.prodVarName,
        prodVarPrice: Number(row.prodVarPrice) || 0,
        prodVarUnit: row.prodVarUnit.trim() || "pc",
        isDeductInv: false,
        inventoryItemId: null,
      }));
    } else {
      if (variantPrice === "" || Number(variantPrice) < 0) {
        toast.error("Please enter a price for this product.");
        return;
      }

      productVariants = [
        {
          prodId: 0,
          prodVarCreatedBy: user?.userId ?? 0,
          prodVarName: formData.prodName,
          prodVarPrice: Number(variantPrice),
          prodVarUnit: variantUnit.trim() || "pc",
          isDeductInv: false,
          inventoryItemId: null,
        },
      ];
    }

    const payload: CreateProductDtos = { ...formData, productVariants };

    const success = await onSubmit(payload);

    if (success) {
      if (mutate) {
        mutate();
        setFormData({
          prodCatId: null,
          storeId: storeId,
          prodCreatedBy: user?.userId ?? 0,
          prodName: "",
        });
        setHasVariants(false);
        setVariantPrice("");
        setVariantUnit("");
        setVariantRows([emptyVariantRow(nextVariantRowId.current++)]);
      }
    }
  };
  return (
    <div className="flex flex-col gap-3 w-full h-full">
      <div className="flex flex-col gap-2">
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

        <div className="flex items-end gap-3">
          <Toggle
            sizes="xs"
            label="Has variants"
            flexType="flex-col"
            initial={hasVariants}
            onToggle={(state) => setHasVariants(state)}
          />

          {!hasVariants && (
            <Input
              label="Price"
              sizes="sm"
              type="number"
              value={variantPrice}
              onChange={(e) => setVariantPrice(e.target.value)}
              name="prodVarPrice"
            />
          )}

          {!hasVariants && (
            <Input
              label="Unit"
              sizes="sm"
              placeholder="pc"
              value={variantUnit}
              onChange={(e) => setVariantUnit(e.target.value)}
              name="prodVarUnit"
            />
          )}
        </div>

        {hasVariants && (
          <Table
            columns={variantColumns}
            data={variantRows}
            uniqueIdKey="id"
            updateData={(data) => setVariantRows(data)}
            debounceTime={0}
            showActions
            renderActions={(row) => (
              <button
                type="button"
                onClick={() => removeVariantRow(row.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            renderTopActionButtons={[
              {
                props: {
                  label: "Add Variant",
                  icon: Plus,
                  size: "xs",
                  color: "secondary",
                  onClick: addVariantRow,
                },
              },
            ]}
            maxHeight="200px"
          />
        )}
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
