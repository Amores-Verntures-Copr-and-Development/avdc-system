import DropDownSearchStore from "@/components/shared/DropDownSearchStore";
import Table from "@/components/shared/Table";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { UserAuth } from "@/hooks/useSession";
import { StoreInterface } from "@/types/stores";
import React, { useState } from "react";
import Button from "@/components/shared/Button";
import { AddItemToStoreDto } from "../view/InventorySection/InventorySection";
interface AddItemStoreModalProps {
  data: DisplayInventoryItems[];
  onCancel: () => void;
  onSubmit: (items: AddItemToStoreDto) => Promise<boolean>;
  user?: UserAuth | null;
}

const columns = [
  { name: "ID", key: "itemId" },
  { name: "Item Name", key: "itemName" },
  { name: "Unit", key: "itemUnit" },
  { name: "Category", key: "categoryName" },
];
const AddItemStoreModal: React.FC<AddItemStoreModalProps> = ({
  data,
  onCancel,
  onSubmit,
}) => {
  const [addItemStoreForm, setAddItemStoreForm] = useState<AddItemToStoreDto>({
    storeId: 0,
    addedById: 0,
    items: data,
  });
  const searchStore = async (query: string): Promise<StoreInterface[]> => {
    const res = await fetch(
      `/api/stores/search?search=${encodeURIComponent(query)}`
    );
    const json = await res.json();
    return json.data || [];
  };
  const handleSubmit = async () => {
    const success = await onSubmit(addItemStoreForm);
    if (success) {
      onCancel();
    }
  };
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Table columns={columns} data={data} uniqueIdKey="itemId" />
      </div>
      <div className="">
        <DropDownSearchStore
          label="Store"
          sizes="xs"
          searchFn={searchStore}
          onSelect={(store) => {
            setAddItemStoreForm({
              ...addItemStoreForm,
              storeId: store.storeId ?? 0,
            });
          }}
          renderItem={(store) => (
            <span>
              <span>{store.storeName}</span>
            </span>
          )}
          displayValue={(s) => `${s.storeName}`}
          placeholder="Search store.."
        />
      </div>
      <div className="flex justify-end gap-2 mt-10">
        <div>
          <Button
            label="Cancel"
            color="secondary"
            size="sm"
            onClick={onCancel}
            className="font-semibold"
          />
        </div>
        <div>
          <Button
            label="Add Item"
            size="sm"
            onClick={handleSubmit}
            className="font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemStoreModal;
