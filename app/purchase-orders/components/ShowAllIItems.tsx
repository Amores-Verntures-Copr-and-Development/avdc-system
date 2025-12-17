import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import Popup from "@/components/shared/Popup";
import Table, { Column } from "@/components/shared/Table";
import {
  CreatePurchaseOrderItemDto,
  DisplayPurchaseOrderItemsDto,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { UserAuth } from "@/hooks/useSession";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import {
  Check,
  Clock,
  Edit,
  LogOut,
  Save,
  SaveOff,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import AddItemToPoModal from "./_components/AddItemToPoModal";
import IconButton from "@/components/shared/IconButton";
import { Rowdies } from "next/font/google";

interface ShowAllIItemsProps {
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request">
  >;
  data: PurchaseOrders | null;
  onSubmit: (data: UpdatePurchaseOrdersDto) => Promise<boolean>;
  isLoading?: boolean;
  mutate: () => void;
  onClose: () => void;
  user: UserAuth | null;
  onAddItem: (
    data: CreatePurchaseOrderItemDto[],
    poId: number
  ) => Promise<boolean>;
  onUpdateItem: (
    data: Partial<PurchaseOrderItems>,
    poId: number
  ) => Promise<boolean>;
}

const ShowAllIItems = ({
  setShowAllItems,
  data,
  user,
  onClose,
  onSubmit,
  isLoading,
  onAddItem,
  onUpdateItem,
}: ShowAllIItemsProps) => {
  const [showAddItem, setShowAddItem] = useState(false);
  const {
    data: itemResponse = { data: [] },
    isLoading: loadingData,
    mutate,
  } = useSWR<{
    data: any;
  }>(`/api/purchase-order/po-items/${data?.poId}`, fetcher);
  const [poItems, setPoItems] = useState<DisplayPurchaseOrderItemsDto[]>([]);
  const [isEditId, setIsEditId] = useState<number | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);
  const [originalPoItems, setOriginalPoItems] = useState<
    DisplayPurchaseOrderItemsDto[]
  >([]);
  const columns: Column<DisplayPurchaseOrderItemsDto>[] = [
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
      editable: (row) => row.poItemId === isEditId,
      inputType: "number",
    },
    {
      name: "Received Qty",
      key: "poItemReceivedQty",
    },
    {
      name: "Supplier",
      key: "selectedSupplierId",
      editable: (row) => row.poItemId === isEditId,
      inputType: "select",

      // 👇 Automatically choose the supplier with the lowest price if none is selected yet
      selector: (row) => {
        if (row.suppId)
          return row.suppliers?.find((supp) => supp.suppId === row.suppId)
            ?.suppName;
        if (!row.suppliers?.length) return "No suppliers";

        // Auto-select the cheapest supplier if not selected yet
        if (!row.selectedSupplierId) {
          const cheapestSupplier = row.suppliers.reduce((prev, curr) =>
            curr.suppItemPrice < prev.suppItemPrice ? curr : prev
          );
          row.selectedSupplierId = cheapestSupplier.suppId;
          row.suppId = cheapestSupplier.suppId;
          row.unitPrice = cheapestSupplier.suppItemPrice;
        }

        // Display supplier name
        const selected = row.suppliers.find(
          (s) => s.suppId === Number(row.selectedSupplierId)
        );
        console.log("Selected: ", selected);
        return selected ? selected.suppName : "Select Supplier";
      },
      value: (row) => {
        return (row.suppId || row.selectedSupplierId)?.toString();
      },
      // Dropdown options
      options: (row: DisplayPurchaseOrderItemsDto) =>
        row.suppliers?.map((s: any) => ({
          label: `${s.suppName} (₱${s.suppItemPrice})`,
          value: s.suppId.toString(),
        })) ?? [],
    },
    {
      name: "Total Price",
      key: "totalPrice",
      selector: (row) => `₱${(row.totalPrice ?? 0).toFixed(2)}`,
      compute: (row) => {
        const selected = row.suppliers?.find(
          (s) => s.suppId === Number(row.selectedSupplierId)
        );
        const supplierPrice = selected?.suppItemPrice ?? 0;
        const quantity = row.poItemOrderedQty ?? 0;
        console.log("supplierPrice: ", supplierPrice);
        console.log("Row: ", row);
        console.log("Total: ", supplierPrice * quantity);
        return supplierPrice * quantity;
      },
      dependsOn: ["selectedSupplierId", "poItemOrderedQty"], // NEW
    },
  ];
  useEffect(() => {
    if (itemResponse.data && itemResponse.data.length > 0) {
      const cloned = structuredClone(itemResponse.data); // deep clone
      setPoItems(cloned);
      setOriginalPoItems(structuredClone(cloned));
    }
  }, [itemResponse.data]);
  const handleApprovedPo = async () => {
    const newData: UpdatePurchaseOrdersDto = {
      ...data,
      poItems: poItems,
      updatedBy: user?.userId ?? 0,
    };
    const success = await onSubmit(newData);
    if (success) {
      onClose();
    }
  };
  const isRowChanged = (row: DisplayPurchaseOrderItemsDto) => {
    const original = originalPoItems.find((o) => o.poItemId === row.poItemId);
    if (!original) return false; // row not found, assume no change

    // Compare all fields you care about
    return (
      original.suppId !== row.suppId ||
      original.unitPrice !== row.unitPrice ||
      original.poItemOrderedQty !== row.poItemOrderedQty ||
      original.poItemReceivedQty !== row.poItemReceivedQty
    );
  };
  const handleUpdatePoItemSuppId = async (
    dataItem: Partial<PurchaseOrderItems>
  ) => {
    console.log({ data });
    if (!dataItem.poItemId) return;
    setIsUpdatingId(dataItem.poItemId);
    try {
      if (!data?.poId) return;
      const success = await onUpdateItem(dataItem, data.poId);
      if (success) {
        mutate();
        setIsEditId(null);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsUpdatingId(null);
    }
  };
  return (
    <div className="gap-5 bg-white h-full flex flex-col overflow-hidden p-4">
      <div className="flex justify-between items-center ">
        {" "}
        <h3 className="font-semibold text-gray-800 mb-3 text-lg flex-shrink-0">
          All Item list
        </h3>
        <div>
          <Button
            icon={<LogOut className="w-3 h-3 2xl:w-3 2xl:h-3" />}
            color="neutral"
            size="xs"
            label="Back"
            onClick={() => {
              setShowAllItems("status");
            }}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Table
          renderTopActions={
            <div>
              <Button
                size="sm"
                label="Add Item"
                onClick={() => {
                  setShowAddItem(true);
                }}
              />
            </div>
          }
          showActions
          renderActions={(row) => {
            const showSave = isRowChanged(row);
            return (
              <div className="flex gap-2 items-center justify-center">
                {isEditId !== row.poItemId ? (
                  <>
                    <IconButton
                      onClick={() => {
                        setIsEditId(row.poItemId);
                        // handleUpdatePoItemSuppId({
                        //   poItemId: row.poItemId,
                        //   suppId: row.suppId,
                        // });
                      }}
                      label="Edit Item"
                      icon={<Edit size={14} />}
                      bg="gray"
                    />
                    <IconButton
                      onClick={() => {
                        // setIsEditId(row.poItemId);
                        // // handleUpdatePoItemSuppId({
                        // //   poItemId: row.poItemId,
                        // //   suppId: row.suppId,
                        // // });
                      }}
                      label="Remove"
                      icon={<Trash2 size={14} />}
                      bg="red"
                    />
                  </>
                ) : (
                  <>
                    <IconButton
                      onClick={() => {
                        setPoItems(structuredClone(originalPoItems)); // restore fresh copy
                        setIsEditId(null);
                      }}
                      label="Cancel"
                      icon={<X size={14} />}
                      bg="red"
                      disable={isUpdatingId === row.poItemId}
                    />
                    <IconButton
                      onClick={() => {
                        handleUpdatePoItemSuppId({
                          poItemId: row.poItemId,
                          suppId: row.suppId,
                          poItemOrderedQty: row.poItemOrderedQty,
                        });
                      }}
                      label="Save"
                      icon={<Check size={14} />}
                      bg="green"
                      disable={!showSave || isUpdatingId === row.poItemId}
                    />
                  </>
                )}
              </div>
            );
          }}
          uniqueIdKey="poItemId"
          localSearch={true}
          isRounded={false}
          loading={loadingData}
          columns={columns}
          data={poItems}
          maxHeight="h-full"
          updateData={setPoItems}
          onCellChange={(_rowIndex, key, value, row) => {
            // If supplier changed, update suppId and unitPrice too
            if (key === "selectedSupplierId") {
              const selected = row.suppliers?.find(
                (s) => s.suppId === Number(value)
              );
              if (selected) {
                row.suppId = selected.suppId; // ✅ mirror value
                row.unitPrice = selected.suppItemPrice; // ✅ keep price updated
              }
            }
            if (key === "poItemOrderedQty") {
              setPoItems((prev) =>
                prev.map((item) =>
                  item.poItemId === row.poItemId
                    ? { ...item, poItemOrderedQty: value }
                    : item
                )
              );
            }
          }}
        />
      </div>
      <div className="border-t  border-gray-300  flex justify-between pl-4 pr-4 pt-4 pb-4 gap-4 items-center">
        <span className="flex items-center">
          <Clock size={15} />{" "}
          <span className="text-xs ml-2">
            {" "}
            Created: {formatDateToWords(data?.poCreatedAt ?? "")}
          </span>
        </span>
        {data?.poStatus === "pending" && (
          <div>
            <Button
              icon={<Check size={15} />}
              onClick={handleApprovedPo}
              size="sm"
              label="Approved"
              className="text-xs font-semibold"
              loading={isLoading}
            />
          </div>
        )}
      </div>
      <Modal
        title="Add Item to PO"
        isOpen={showAddItem}
        onClose={function (): void {
          setShowAddItem(false);
        }}
        size="lg"
        className="h-[50%]"
      >
        <AddItemToPoModal
          onAddItem={onAddItem}
          mutate={mutate}
          user={user}
          poId={data?.poId ?? 0}
          currentItemId={poItems.map((item) => item.itemId)}
        />
      </Modal>
      <Modal
        isOpen={false}
        onClose={function (): void {
          throw new Error("Function not implemented.");
        }}
        title="Update PO Item supplier"
      >
        <div></div>
      </Modal>
    </div>
  );
};

export default ShowAllIItems;
