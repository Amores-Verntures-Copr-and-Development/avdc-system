import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayPurchaseOrderItemsDto,
  DisplayRequisitionWithItems,
} from "@/dtos/purchase.dto";
import { useSession } from "@/hooks/useSession";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import { Plus, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
interface AddItemToRequestFromPOModaProps {
  reqData: DisplayRequisitionWithItems | null;
  poData: PurchaseOrders | null;
  onAddItem: (data: POAddToRequestItemForm) => Promise<boolean>;
  onClose: () => void;
  mutate: () => void;
}

export interface POAddToRequestItem {
  poItemId: number;
  itemId: number;
  itemPrice: number;
}

export interface POAddToRequestItemForm {
  poItems: POAddToRequestItem[];
  poId: number;
  requestId: number;
  addedBy: number;
}
interface DisplayPurchaseOrderItemsDtoExtended extends DisplayPurchaseOrderItemsDto {
  reqItemTransfer?: number;
}
const AddItemToRequestFromPOModal = ({
  reqData,
  poData,
  onAddItem,
  onClose,
  mutate: mutateRequest,
}: AddItemToRequestFromPOModaProps) => {
  const { user } = useSession();
  const { data: itemResponse = { data: [] } } = useSWR<{
    data: DisplayPurchaseOrderItemsDto[];
  }>(`/api/purchase-order/po-items/${poData?.poId}`, fetcher);
  const [poItems, setPoItems] = useState<
    DisplayPurchaseOrderItemsDtoExtended[]
  >([]);
  const [selectedPoItems, setSelectedPoItems] = useState<POAddToRequestItem[]>(
    [],
  );
  const [isAdding, setIsAdding] = useState(false);
  const reqItemIds = reqData?.requestItemsData.map((item) => item.itemId) || [];

  useEffect(() => {
    if (itemResponse.data && itemResponse.data.length > 0) {
      // deep clone
      const filteredItems = itemResponse.data.filter((poItem) => {
        return !reqItemIds.includes(poItem.itemId);
      });

      setPoItems(filteredItems);
    }
  }, [itemResponse.data]);
  const columns: Column<DisplayPurchaseOrderItemsDtoExtended>[] = [
    {
      name: "#",
      key: "#",
      selector: (_row, index) => index + 1,
    },
    {
      name: "Item Name",
      key: "itemName",
    },
    {
      name: "Unit",
      key: "itemUnit",
    },
    {
      name: "Ordered Qty",
      key: "poItemOrderedQty",
    },
    {
      name: "Received Qty",
      key: "poItemReceivedQty",
    },
    {
      name: "Supplier",
      key: "suppId",
      inputType: "select",
      selectOptionVariant: "native",
      selector: (row) => {
        if (!row.suppliers?.length) return "No suppliers";

        const selectedId =
          row.selectedSupplierId !== undefined ? null : row.suppId;

        if (!selectedId) return "Select Supplier";

        const selected = row.suppliers.find(
          (s) => s.suppId === Number(selectedId),
        );

        return selected
          ? `${selected.suppName} (₱${selected.suppItemPrice})`
          : "Select Supplier";
      },
    },
    {
      name: "Total Price",
      key: "totalPrice",

      selector: (row) => {
        const supplier = row.suppliers?.find(
          (s) => s.suppId === Number(row.suppId),
        );

        const supplierPrice = Number(supplier?.suppItemPrice) || 0;
        const qty = Number(row.poItemOrderedQty) || 0;

        return `₱${(supplierPrice * qty).toFixed(2)}`;
      },

      value: (row) => {
        const supplier = row.suppliers?.find(
          (s) => s.suppId === Number(row.suppId),
        );

        return (
          (Number(supplier?.suppItemPrice) || 0) *
          (Number(row.poItemOrderedQty) || 0)
        );
      },
    },
  ];
  const itemAddcolumns: Column<POAddToRequestItem>[] = [
    {
      name: "#",
      key: "#",
      selector: (_row, index) => index + 1,
    },
    {
      name: "Item Name",
      key: "itemName",
      selector: (row) => {
        const poItem = poItems.find((item) => item.itemId === row.itemId);
        return poItem ? poItem.itemName : "Item not found";
      },
    },
    {
      name: "Unit",
      key: "itemUnit",
      selector: (row) => {
        const poItem = poItems.find((item) => item.itemId === row.itemId);
        return poItem ? poItem.itemName : "Item not found";
      },
    },
  ];

  const submitAddItemsToRequest = async () => {
    setIsAdding(true);
    if (!poData || !reqData) return;

    const formData: POAddToRequestItemForm = {
      poItems: selectedPoItems,
      poId: poData.poId,
      requestId: reqData.requestId,
      addedBy: user?.userId ?? 0,
    };

    const success = await onAddItem(formData);
    if (success) {
      setIsAdding(false);
      mutateRequest();
      setSelectedPoItems([]);
      onClose();
    }
    setIsAdding(false);
  };
  const onRemoveItem = (poItemId: number) => {
    const filterItem = selectedPoItems.filter((i) => i.poItemId !== poItemId);
    setSelectedPoItems(filterItem);
  };
  return (
    <div className="flex h-full flex-col gap-2">
      <span className="text-xs xl:text-sm font-semibold">
        Note:
        <span className="font-normal">
          {" "}
          Adding an item to this request will also add it to the purchase order.
          If the item already exists in the purchase order, it will not be
          duplicated.
        </span>
      </span>
      <div className="flex flex-col min-h-0 h-full">
        <Table<DisplayPurchaseOrderItemsDtoExtended>
          columns={columns}
          localSearch
          uniqueIdKey="poItemId"
          data={poItems}
          maxHeight="h-full"
          showActions
          renderActions={(row) => (
            <div>
              <IconButton
                onClick={() => {
                  setSelectedPoItems((prev) => {
                    return [
                      ...prev,
                      {
                        poItemId: row.poItemId,
                        itemId: row.itemId,
                        itemPrice: row.unitPrice,
                      },
                    ];
                  });
                }}
                label={"Add to Request List"}
                bg={"green"}
                icon={<Plus size={16} />}
                disable={selectedPoItems.some(
                  (item) => item.itemId === row.itemId,
                )}
              />
            </div>
          )}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-sm font-semibold">Item list to be add</h1>
        <Table<POAddToRequestItem>
          columns={itemAddcolumns}
          data={selectedPoItems}
          maxHeight="h-full"
          showActions
          renderActions={(row) => (
            <div>
              <IconButton
                onClick={() => {
                  onRemoveItem(row.poItemId);
                }}
                label={"Remove"}
                bg={"red"}
                icon={<Trash size={16} />}
              />
            </div>
          )}
        />
      </div>
      <div className="flex mt-auto justify-end gap-3">
        <div>
          <Button
            label="Cancel"
            size="sm"
            color="secondary"
            disabled={isAdding}
          />
        </div>
        <div>
          <Button
            label="Add to Request"
            size="sm"
            disabled={selectedPoItems.length === 0}
            onClick={submitAddItemsToRequest}
            loading={isAdding}
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemToRequestFromPOModal;
