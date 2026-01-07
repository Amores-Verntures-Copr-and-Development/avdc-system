import Table, { Column } from "@/components/shared/Table";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { UserAuth } from "@/hooks/useSession";
import React, { useEffect, useState } from "react";
import Button from "@/components/shared/Button";
import {
  CreateProductDtos,
  CreateProductVariantDto,
} from "@/dtos/products.dto";
import Toggle from "@/components/shared/Toggle";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import { ItemInterface } from "@/types/items";
import { Products } from "@/types/products";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import { formatPeso } from "@/utils/formatPeso";
interface AddItemToProductModalProps {
  data: DisplayInventoryItems[];
  onCancel: () => void;
  onSubmit: (prodcuts: AddItemToProductStoreInterface) => Promise<boolean>;
  user: UserAuth | null;
  storeId: number;
  isLoading: boolean;
}
export interface AddItemToProductStoreInterface {
  isAddAsVariant: boolean;
  prodId?: number;
  productVariant: CreateProductVariantDto[];
  storeId?: number;
}
const AddItemToProductModal = ({
  data,
  onCancel,
  onSubmit,
  storeId,
  user,
  isLoading,
}: AddItemToProductModalProps) => {
  const [addProductForm, setAddProductForm] =
    useState<AddItemToProductStoreInterface>({
      isAddAsVariant: false,
      prodId: undefined,
      productVariant: [],
      storeId: undefined,
    });
  const [products, setProducts] = useState<CreateProductVariantDto[]>([]);
  const [isAddAsVariant, setIsAddAsVariant] = useState(false);
  const columns: Column<CreateProductVariantDto>[] = [
    // { name: "#", key: "#", selector: (_row, index) => index + 1 },
    // {
    //   name: "Item Name",
    //   key: "itemName",
    //   selector: (row) =>
    //     data.find((i) => i.inventoryItemId === row.inventoryItemId)?.itemName,
    // },
    // {
    //   name: "Unit",
    //   key: "itemUnit",
    //   selector: (row) =>
    //     data.find((i) => i.inventoryItemId === row.inventoryItemId)?.itemUnit,
    // },
    // {
    //   name: "Category",
    //   key: "categoryName",
    //   selector: (row) =>
    //     data.find((i) => i.inventoryItemId === row.inventoryItemId)
    //       ?.categoryName,
    // },
    // {
    //   name: "Cost  Price",
    //   key: "itemPrice",
    //   selector: (row) =>
    //     formatPeso(
    //       data.find((i) => i.inventoryItemId === row.inventoryItemId)?.itemPrice
    //     ),
    // },
    {
      name: "Selling  Price",
      key: "prodVarPrice",
      editable: true,
      inputType: "number",
    },
  ];
  useEffect(() => {
    if (data) {
      setProducts(
        data.map((item) => ({
          prodId: 0,
          inventoryItemId: item.inventoryItemId,
          prodVarCreatedBy: user?.userId || 0,
          prodVarName: item.itemName,
          prodVarUnit: item.itemUnit,
          prodVarPrice: 0,
          varianComponents: [
            {
              varComId: 0,
              quantityRequired: 1,
              prodVarId: 0,
              inventoryItemId: item.inventoryItemId,
            },
          ],
        }))
      );
    }
  }, [data]);

  const handleSubmit = async () => {
    const addProdct: AddItemToProductStoreInterface = {
      isAddAsVariant: addProductForm.isAddAsVariant,
      prodId: addProductForm.prodId,
      productVariant: products,
      storeId: storeId,
    };
    console.log({ addProdct });
    const success = await onSubmit(addProdct);
    if (success) {
      onCancel();
    }
  };

  const searchItems = async (query: string): Promise<Products[]> => {
    const res = await fetch(
      `/api/products/${storeId}?search=${encodeURIComponent(query)}`
    );
    const json = await res.json();
    return json.data || [];
  };
  return (
    <div className="flex flex-col gap-5">
      <span className="font-semibold text-sm">
        Notes:{" "}
        <span className="text-sm font-normal">
          This items will be included to your products.
        </span>
      </span>

      <div className="flex flex-col sm:flex-row justify-start gap-3">
        {/* Add as Variant Toggle */}
        <div className="bg-white border border-gray-200 rounded-lg px-2 py-1.5  shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Toggle
              onToggle={(state) => {
                setAddProductForm((prev) => ({
                  ...prev,
                  isAddAsVariant: state,
                }));
              }}
            />
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Add as Variant
              </label>
              <span className="text-xs text-gray-500">
                {addProductForm.isAddAsVariant ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
        {addProductForm.isAddAsVariant && (
          <div className=" bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm hover:shadow-md transition-shadow">
            <DropdownSearch<Products>
              label="Select Parent Product"
              sizes="xs"
              onSelect={function (item: Products): void {
                setAddProductForm((prev) => ({ ...prev, prodId: item.prodId }));
              }}
              searchFn={searchItems}
              renderItem={(item: Products) => <span>{item.prodName}</span>}
              displayValue={(item) => item.prodName}
            />
          </div>
        )}
      </div>
      <div>
        <Table
          columns={columns}
          data={products}
          updateData={setProducts}
          uniqueIdKey="prodId"
        />
      </div>
      <div className="flex justify-end gap-2">
        <div>
          <Button
            label="Cancel"
            color="secondary"
            size="sm"
            onClick={onCancel}
            className="font-semibold"
            disabled={isLoading}
          />
        </div>
        <div>
          <Button
            label="Add Item"
            size="sm"
            onClick={handleSubmit}
            className="font-semibold"
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemToProductModal;
