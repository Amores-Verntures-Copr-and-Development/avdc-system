import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import Input from "@/components/shared/Input";
import Table, { Column } from "@/components/shared/Table";
import { inventoryData } from "@/data/itemData";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { CreateRequestItemDto } from "@/dtos/request.dto";
import { UserAuth } from "@/hooks/useSession";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
import { ItemInterface } from "@/types/items";
import { fetcher } from "@/utils/fetcher";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface RequestItem {
  id: number;
  itemId: number;
  itemName: string;
  unit: string;
  quanity: number;
}

const columns: Column<DisplayInventoryItems>[] = [
  { name: "ID", key: "inventoryItemId" },
  { name: "Item Name", key: "itemName" },
  { name: "Stock", key: "inventoryItemQuantity" },
  { name: "Price", key: "itemPrice" },
  { name: "Unit", key: "itemUnit" },
  { name: "Category", key: "categoryName" },
];

interface CreateRequestModalProps {
  user: UserAuth | null;
  onCancel: () => void;
  onSubmit: (data: CreateRequestItemDto[]) => Promise<boolean>;
}
const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  user,
  onCancel,
  onSubmit,
}) => {
  const columnRequest: Column<CreateRequestItemDto>[] = [
    { name: "#", key: "#", selector: (_row, index) => index + 1 },
    {
      name: "Item Name",
      key: "itemName",
      selector: (row) =>
        itemResponse.data.find((data) => data.inventoryItemId === row.invItem)
          ?.itemName,
    },
    {
      name: "Price",
      key: "itemPrice",
      selector: (row) =>
        itemResponse.data.find((data) => data.inventoryItemId === row.invItem)
          ?.itemPrice,
    },
    {
      name: "Unit",
      key: "itemUnit",
      selector: (row) =>
        itemResponse.data.find((data) => data.inventoryItemId === row.invItem)
          ?.itemUnit,
    },
    {
      name: "Category",
      key: "categoryName",
      selector: (row) =>
        itemResponse.data.find((data) => data.inventoryItemId === row.invItem)
          ?.categoryName,
    },
    { name: "Request Qty", key: "reqItemQuantity" },
  ];
  const [selectedRow, setSelectedRow] = useState<DisplayInventoryItems>();
  const [requestQty, setRequestQty] = useState<string>("");
  const [requestedItems, setRequestedItems] =
    useState<CreateRequestItemDto[]>();
  const [inventoryId, setInventoryId] = useState(0);
  const {
    data: inventoryResponse = { data: [] },
    isLoading,
    mutate: mutateInventory,
  } = useSWR<{ data: InventoryInterface[] }>(
    `/api/inventory/${user?.storeId}`,
    fetcher
  );
  useEffect(() => {
    if (inventoryResponse && inventoryResponse.data.length > 0) {
      setInventoryId(inventoryResponse.data[0].inventoryId);
    }
  }, [inventoryResponse]);
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: DisplayInventoryItems[] }>(
    inventoryId ? `/api/inventory/item/${inventoryId}` : null,
    fetcher
  );

  const handleAddItemRequest = async (data: DisplayInventoryItems) => {
    if (Number(requestQty) === 0) {
      toast.error("Input quantity!");
      return;
    }
    setRequestedItems((prev) => [
      ...(prev ?? []), // if prev is undefined, use []
      {
        reqItemQuantity: Number(requestQty),
        invItem: data.inventoryItemId,
        requestId: 0,
      },
    ]);
    handleClearSelected();
  };
  const handleClearSelected = () => {
    setSelectedRow(undefined);
    setRequestQty("");
  };

  const handleSubmitCreateRequest = async () => {
    if (requestedItems) {
      const success = await onSubmit(requestedItems);
      if (success) {
        onCancel();
      }
    }
  };
  return (
    <div className="flex flex-col gap-2 overflow-auto max-h-[80vh]">
      <div className="flex flex-col gap-5 overflow-auto p-4 ">
        <div className="bg-white border border-gray-300 rounded shadow-xs">
          <div className="border-b border-gray-300 p-2">
            <h1 className="text-sm font-semibold">Inventory Item</h1>
          </div>
          <div className="flex p-2 justify-between gap-4">
            <div className="flex flex-2 flex-col ">
              <div className="p-2 flex-1 min-h-0  flex flex-col">
                <Table
                  textSize="xs"
                  columns={columns}
                  data={itemResponse.data}
                  isRounded={false}
                  onRowSelection={(selectedRow) => {
                    handleClearSelected();
                    setSelectedRow(selectedRow);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-1 flex-col bg-white shadow-sm rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                Selected Item
              </h2>

              {selectedRow ? (
                <>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Name
                      </span>
                      <span className="text-sm text-gray-800 font-medium">
                        {selectedRow.itemName}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Stock Available
                      </span>
                      <span className="text-sm text-green-600 font-semibold">
                        {selectedRow.inventoryItemQuantity}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Status
                      </span>
                      <span className="text-sm text-gray-700">Good</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Request Qty
                      </span>
                      <Input
                        label=""
                        sizes="xs"
                        type="number"
                        value={requestQty}
                        onChange={(e) => {
                          setRequestQty(e.target.value); // convert from string to number
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <div>
                      {" "}
                      <Button
                        icon={<Plus size={18} />}
                        size="xs"
                        label="Add Item"
                        className=" text-white font-medium shadow-sm"
                        onClick={() => {
                          handleAddItemRequest(selectedRow);
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-sm italic">No item selected</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-300 p-2 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-sm font-semibold">Requested Items</h1>
            <div className="flex flex-col">
              <span className="text-xs">{requestedItems?.length} item(s)</span>
            </div>
          </div>

          <div className="flex-1 min-h-0  flex flex-col">
            <Table
              columns={columnRequest}
              data={requestedItems ?? []}
              isRounded={false}
            />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-300 p-4 flex justify-end">
        <div className="flex gap-2">
          <div>
            {" "}
            <Button
              label="Cancel"
              onClick={onCancel}
              color="secondary"
              size="sm"
            />
          </div>
          <div>
            {" "}
            <Button
              size="sm"
              label="Submit"
              onClick={handleSubmitCreateRequest}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestModal;
