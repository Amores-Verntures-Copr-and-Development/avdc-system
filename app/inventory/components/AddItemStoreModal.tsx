import DropDownSearchStore from "@/components/shared/DropDownSearchStore";
import Table from "@/components/shared/Table";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { UserAuth } from "@/hooks/useSession";
import { StoreInterface } from "@/types/stores";
import React, { useEffect, useState } from "react";
import Button from "@/components/shared/Button";
import { AddItemToStoreDto } from "../view/InventorySection/InventorySection";
import IconButton from "@/components/shared/IconButton";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
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
  const [inventoryItems, setInventoryItems] = useState<
    DisplayInventoryItems[] | null
  >(null);
  const searchStore = async (query: string): Promise<StoreInterface[]> => {
    const res = await fetch(
      `/api/stores/search?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data || [];
  };
  useEffect(() => {
    if (data && data.length > 0) {
      setInventoryItems(data);
    }
  }, [data]);

  const handleSubmit = async () => {
    const success = await onSubmit(addItemStoreForm);
    if (success) {
      onCancel();
    }
  };
  const handleRemoveItem = (row: DisplayInventoryItems) => {
    const newData = inventoryItems?.filter(
      (item) => item.itemId !== row.itemId,
    );

    if (newData) {
      setInventoryItems(newData);
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-sm w-full bg-blue-100 border-l-4 border-blue-500 text-blue-800 px-4 py-3 shadow-md rounded-md flex items-center`}
        >
          <span className="mr-2 font-semibold">Info:</span>
          <span>{row.itemName} from the list</span>
        </div>
      ));
    }
  };
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Table
          columns={columns}
          data={inventoryItems ?? []}
          uniqueIdKey="itemId"
          showActions
          isRounded={false}
          renderActions={(row) => (
            <div className="flex justify-center">
              <IconButton
                onClick={() => {
                  handleRemoveItem(row);
                }}
                label={"Remove"}
                bg={"red"}
                icon={<Trash2 className="w-3 h-4 xl:w-4 xl:h-4" />}
              />
            </div>
          )}
        />
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
