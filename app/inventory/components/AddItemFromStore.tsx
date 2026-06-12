import ConfirmationModal from "@/components/shared/ConfirmationModal";
import { Card, CardContent, CardTitle } from "@/components/shared/CustomCard";
import LoaderComponent from "@/components/shared/LoaderComponent";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { useStores } from "@/hooks/userStore";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { Check, PackagePlus, Plus, Store } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";

interface AddItemFromStoreProps {
  inventoryType: "stores" | "stock-room" | "inventoryId";
  inventoryId: number;
  showAddComponent?: boolean;
  setShowAddComponent?: React.Dispatch<React.SetStateAction<boolean>>;
}
const AddItemFromStore = ({
  inventoryId,
  inventoryType,
  setShowAddComponent,
}: AddItemFromStoreProps) => {
  const { user, hasStore } = useSession();
  const [isAddItem, setIsAddingItem] = useState<DisplayInventoryItems | null>(
    null,
  );
  console.log({ inventoryType, inventoryId });
  const { stores, isLoading } = useStores({ user, isAdmin: true, hasStore });
  console.log({ stores });
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const { data: responseItems, isLoading: isLoadingItems } = useSWR<
    ApiResponse<DisplayInventoryItems[]>
  >(
    inventoryId
      ? `/api/inventory/${inventoryId}/not-in-store/${selectedStore}`
      : null,
    fetcher,
  );

  const handleSubmitAddItemFromStore = async () => {
    try {
      const res = await fetch(``, {
        method: "POST",
      });
    } catch (e) {}
  };
  const items = responseItems?.data ?? [];
  return (
    <div className="flex-1 h-full flex flex-col">
      <div className="flex flex-1 h-full gap-2">
        <Card className="h-full flex-[4]">
          <CardTitle className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Select store</p>
            <p className="text-xs text-gray-500">
              Choose where to copy items from
            </p>
          </CardTitle>
          <CardContent className="flex flex-col overflow-y-auto gap-2 mt-2">
            {isLoading ? (
              <LoaderComponent />
            ) : (
              Array.isArray(stores) &&
              stores.map((s) => (
                <div
                  key={s.storeId}
                  className={`p-2 flex gap-2 items-start hover:bg-gray-200  rounded-sm ${selectedStore === s.storeId ? `bg-blue-100` : ``} `}
                  onClick={() => setSelectedStore(s.storeId!)}
                >
                  <div className="w-4 h-4 mt-0.5 flex items-center justify-center shrink-0">
                    <Store
                      className={`w-3.5 h-3.5 ${selectedStore === s.storeId ? `text-blue-500` : `text-gray-700`} `}
                    />
                  </div>

                  <div className="flex flex-col leading-tight min-w-0">
                    <label
                      className={`text-xs  font-semibold ${selectedStore === s.storeId ? `text-blue-500` : `text-gray-700`}`}
                    >
                      {s.storeName}
                    </label>
                    <span className="text-[11px] text-gray-600">
                      {s.storeLocation}
                    </span>
                  </div>
                  {selectedStore === s.storeId && (
                    <div className="w-4 h-4 mt-0.5 flex items-center justify-center shrink-0">
                      <Check className={`w-3.5 h-3.5 text-blue-500`} />
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="h-full flex-[6] flex flex-col overflow-hidden">
          <CardTitle className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Available items
              </p>
              <p className="text-xs text-gray-500">
                Items not yet added to this store
              </p>
            </div>

            {selectedStore && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {responseItems?.count} items
              </span>
            )}
          </CardTitle>

          <CardContent className="flex-1 min-h-0 p-0 pt-2">
            {!selectedStore ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  No store selected
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Select a store to view available items.
                </p>
              </div>
            ) : isLoadingItems ? (
              <LoaderComponent />
            ) : items.length > 0 ? (
              <div className="h-full overflow-y-auto pr-1">
                {" "}
                <div className="space-y-1 pb-2">
                  {items.map((i) => (
                    <div
                      key={i.inventoryItemId}
                      className="group flex items-center justify-between rounded-xl border border-transparent px-3 py-2.5 transition hover:border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          <PackagePlus className="h-4 w-4 text-gray-500" />
                        </div>

                        <div className="min-w-0">
                          <p className=" text-xs font-semibold text-gray-800">
                            {i.itemName}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {i.itemUnit || "No unit"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => {
                          setIsAddingItem(i);
                          if (setShowAddComponent) {
                            setShowAddComponent(true);
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  All items are already added
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  This store has no missing inventory items.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmationModal
        onConfirm={function (): void {
          throw new Error("Function not implemented.");
        }}
        confirmationInfo={`Are you sure you want to add ${isAddItem?.itemName} to your inventory?`}
        onClose={function (): void {
          setIsAddingItem(null);
          if (setShowAddComponent) {
            setShowAddComponent(false);
          }
        }}
        isShow={isAddItem !== null}
        title="Add item from Store"
        confirmLabel="Confirm"
      />
    </div>
  );
};

export default AddItemFromStore;
