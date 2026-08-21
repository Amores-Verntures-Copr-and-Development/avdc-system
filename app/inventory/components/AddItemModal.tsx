import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import DropDownSelectCategory from "@/components/shared/DropDownSelectCategory";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/TextArea";
import Toggle from "@/components/shared/Toggle";
import { unitOptions } from "@/constants/dropdown-options";
import { CreateFirstItem } from "@/dtos/inventory.dto";
import { Products } from "@/types/products";
import { UserAuth } from "@/hooks/useSession";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";

export interface AddToProductOptions {
  isAddAsVariant: boolean;
  prodId?: number;
  prodVarPrice: number;
}

interface AddItemModalProps {
  onCancel: () => void;
  onSubmit: (
    data: CreateFirstItem,
    productOptions?: AddToProductOptions,
  ) => Promise<boolean>;
  user?: UserAuth | null;
  loading?: boolean;
  isAdmin: boolean;
  hasStore: boolean;
  inventoryType: "stores" | "stock-room" | "inventoryId";
  inventoryId: number;
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  onCancel,
  onSubmit,
  user,
  loading,
  inventoryId,
  inventoryType,
}) => {
  const isUserStores = user?.storeId !== null;
  const [inventoryForm, setInventoryForm] = useState<CreateFirstItem>({
    inventoryId: 0,
    inventoryItemCreatedBy: 0,
    itemAddedBy: 0,
    itemName: "",
    itemPrice: 0,
    itemUnit: "",
    itemDescription: "",
    inventoryItemMin: 0,
    inventoryItemQuantity: 0,
    inventoryItemReferenceType: "item",
    inventoryItemReferenceId: 0,
    categoryId: 0,
  });

  // Products only exist per-store, so linking a new item to one only makes
  // sense when this modal is adding to a store's inventory, not a
  // stock-room's.
  const canAddToProduct = inventoryType !== "stock-room";
  const [isAddToProduct, setIsAddToProduct] = useState(false);
  const [isAddAsVariant, setIsAddAsVariant] = useState(false);
  const [prodId, setProdId] = useState<number | undefined>(undefined);
  const [prodVarPrice, setProdVarPrice] = useState<number>(0);

  const handleItemChange = handleChange(inventoryForm, setInventoryForm);

  const searchProducts = async (query: string): Promise<Products[]> => {
    const res = await fetch(
      `/api/products/${user?.storeId}?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data || [];
  };

  const handleSubmit = async () => {
    if (!inventoryForm.itemName || inventoryForm.itemName.trim() === "") {
      toast.error("Item name is required");
      return;
    }
    if (!inventoryForm.categoryId || inventoryForm.categoryId === 0) {
      toast.error("Category is required");
      return;
    }
    if (inventoryForm.itemUnit.trim() === "") {
      toast.error("Item unit is required");
      return;
    }
    if (isAddToProduct) {
      if (isAddAsVariant && !prodId) {
        toast.error("Select the parent product for this variant");
        return;
      }
      if (!(Number(prodVarPrice) > 0)) {
        toast.error("Set a selling price greater than 0");
        return;
      }
    }

    const success = await onSubmit(
      inventoryForm,
      isAddToProduct ? { isAddAsVariant, prodId, prodVarPrice } : undefined,
    );
    if (success) {
      onCancel();
    }
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex flex-col 2xl:flex-row gap-4">
        <Input
          label={"Name"}
          name="itemName"
          sizes="xs"
          onChange={handleItemChange}
          value={inventoryForm.itemName}
        />
        <DropDownSelectCategory
          referenceType={isUserStores ? "stores" : "stock-room"}
          id={inventoryId ?? 0}
          categoryType="item"
          name={"categoryId"}
          sizes="xs"
          label="Category"
          value={`${inventoryForm.categoryId}`}
          onChange={handleItemChange}
        />
      </div>
      <div className="flex flex-col 2xl:flex-row gap-4">
        <DropdownSelect
          label={"Unit"}
          name="itemUnit"
          sizes="xs"
          onChange={handleItemChange}
          value={inventoryForm.itemUnit}
          options={unitOptions}
        />
        <Input
          label={"Price"}
          type="number"
          name="itemPrice"
          sizes="xs"
          onChange={handleItemChange}
          value={inventoryForm.itemPrice}
        />
      </div>
      <div className="flex flex-col 2xl:flex-row gap-4">
        <Textarea
          label={"Description"}
          name="itemDescription"
          sizes="xs"
          onChange={handleItemChange}
          value={inventoryForm.itemDescription ?? ""}
        />
      </div>
      <div className="flex flex-col 2xl:flex-row gap-4">
        <Input
          label={"Quantity"}
          type="number"
          name="inventoryItemQuantity"
          sizes="xs"
          onChange={handleItemChange}
          value={
            inventoryForm.inventoryItemQuantity === 0
              ? ""
              : inventoryForm.inventoryItemQuantity
          }
        />
        <Input
          label={"Minimum Stock"}
          sizes="xs"
          type="number"
          onChange={handleItemChange}
          value={
            inventoryForm.inventoryItemMin === 0
              ? ""
              : inventoryForm.inventoryItemMin
          }
          name="inventoryItemMin"
        />
      </div>

      {canAddToProduct && (
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          <div className="flex items-center gap-3">
            <Toggle onToggle={(state) => setIsAddToProduct(state)} />
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Also list this in Products
              </label>
              <span className="text-xs text-gray-500">
                {isAddToProduct ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>

          {isAddToProduct && (
            <>
              <div className="flex items-center gap-3">
                <Toggle onToggle={(state) => setIsAddAsVariant(state)} />
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">
                    Add as Variant of an existing Product
                  </label>
                  <span className="text-xs text-gray-500">
                    {isAddAsVariant
                      ? "Enabled - pick the parent product below"
                      : "Disabled - this will create a new standalone Product"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col 2xl:flex-row gap-4">
                {isAddAsVariant && (
                  <DropdownSearch<Products>
                    label="Parent Product"
                    sizes="xs"
                    onSelect={(item) => setProdId(item.prodId)}
                    searchFn={searchProducts}
                    renderItem={(item) => <span>{item.prodName}</span>}
                    displayValue={(item) => item.prodName}
                  />
                )}
                <Input
                  label={"Selling Price"}
                  type="number"
                  sizes="xs"
                  onChange={(e) => setProdVarPrice(Number(e.target.value))}
                  value={prodVarPrice === 0 ? "" : prodVarPrice}
                  name="prodVarPrice"
                />
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-10">
        <div>
          {" "}
          <Button
            label="Cancel"
            color="secondary"
            size="sm"
            onClick={onCancel}
            className="font-semibold"
            disabled={loading}
          />
        </div>
        <div>
          {" "}
          <Button
            label="Add Item"
            size="sm"
            onClick={handleSubmit}
            className="font-semibold"
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;
