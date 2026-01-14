import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";

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
import { ArrowLeft, Check, Clock, Edit, LogOut, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import AddItemToPoModal from "./_components/AddItemToPoModal";
import IconButton from "@/components/shared/IconButton";
import { getPurchaseStatusOption } from "@/utils/purchaserOrderUtils";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import ConfirmationModal from "@/components/shared/ConfirmationModal";

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
  onRemoveItem?: (
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
  onRemoveItem,
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
  const [showDeleteItem, setShowDeleteItem] = useState(false);
  const [selectedItemId, setSelectedItem] =
    useState<DisplayPurchaseOrderItemsDto | null>(null);
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
      selector: (row) =>
        formatQuantityByUnit(row.poItemOrderedQty, row.itemUnit ?? ""),
    },
    {
      name: "Received Qty",
      key: "poItemReceivedQty",
    },
    {
      name: "Supplier",
      key: "suppId",
      editable: (row) => row.poItemId === isEditId,
      inputType: "select",
      selectOptionVariant: "native",
      selector: (row) => {
        if (!row.suppliers?.length) return "No suppliers";

        const selectedId =
          row.selectedSupplierId !== undefined ? null : row.suppId;

        if (!selectedId) return "Select Supplier";

        const selected = row.suppliers.find(
          (s) => s.suppId === Number(selectedId)
        );

        return selected
          ? `${selected.suppName} (₱${selected.suppItemPrice})`
          : "Select Supplier";
      },
      value: (row) => {
        console.log("Supplier value function:", {
          selectedSupplierId: row.selectedSupplierId,
          suppId: row.suppId,
          returnValue:
            row.selectedSupplierId === null ||
            row.selectedSupplierId === undefined ||
            row.selectedSupplierId === ""
              ? null
              : (row.selectedSupplierId || row.suppId)?.toString() || null,
        });
        // Return empty string if explicitly cleared, otherwise use existing value
        if (
          row.selectedSupplierId !== undefined ||
          row.selectedSupplierId === null ||
          row.selectedSupplierId === ""
        ) {
          return row.selectedSupplierId === null
            ? null
            : String(row.selectedSupplierId);
        }

        // Initial load fallback (backend value)
        return row.suppId != null ? String(row.suppId) : null;
      },
      // Dropdown options
      options: (row: DisplayPurchaseOrderItemsDto) => {
        const supplierOptions =
          row.suppliers?.map((s: any) => ({
            label: `${s.suppName} (₱${s.suppItemPrice})`,
            value: s.suppId.toString(),
          })) ?? [];

        // Change from value: null to value: ""
        return [{ label: "Select...", value: "" }, ...supplierOptions];
      },
    },
    {
      name: "Total Price",
      key: "totalPrice",

      selector: (row) => {
        const supplier = row.suppliers?.find(
          (s) => s.suppId === Number(row.suppId)
        );

        const supplierPrice = Number(supplier?.suppItemPrice) || 0;
        const qty = Number(row.poItemOrderedQty) || 0;

        return `₱${(supplierPrice * qty).toFixed(2)}`;
      },

      value: (row) => {
        const supplier = row.suppliers?.find(
          (s) => s.suppId === Number(row.suppId)
        );

        return (
          (Number(supplier?.suppItemPrice) || 0) *
          (Number(row.poItemOrderedQty) || 0)
        );
      },
    },
    {
      name: "Status",
      key: "poItemStatus",
      selector: (row) => {
        const { bg, color, label } = getPurchaseStatusOption(
          row.poItemStatus ?? ""
        );
        return (
          <div className={`${bg} ${color} text-center py-1 px-.5 rounded-sm`}>
            <span>{label}</span>
          </div>
        );
      },
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
      original.suppId !== (Number(row.suppId) || null) ||
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
      const newData: Partial<PurchaseOrderItems> = {
        ...dataItem,
        suppId: Number(dataItem.suppId) || null,
      };
      console.log("Updating PO Item:", newData);
      const success = await onUpdateItem(newData, data.poId);
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
  const handleRemoveItem = async () => {
    if (!selectedItemId?.poItemId || !data?.poId) return;
    try {
      if (onRemoveItem === undefined) return;
      const success = await onRemoveItem(selectedItemId, data.poId);
      if (success) {
        mutate();
        setShowDeleteItem(false);
        setSelectedItem(null);
      }
    } catch (e) {
      console.log(e);
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
            icon={ArrowLeft}
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
                        setShowDeleteItem(true);
                        setSelectedItem(row);
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
              setPoItems((prev) =>
                prev.map((item) =>
                  item.poItemId === row.poItemId
                    ? {
                        ...item,
                        selectedSupplierId: value ? Number(value) : null,
                        suppId: selected?.suppId ?? null,
                        unitPrice: selected?.suppItemPrice ?? 0,
                      }
                    : item
                )
              );
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
              icon={Check}
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
      {/* <Modal
        isOpen={showDeleteItem}
        onClose={function (): void {
          setShowDeleteItem(false);
        }}
        title="Remove from PO"
      >
        <div></div>
      </Modal> */}
      <ConfirmationModal
        onConfirm={handleRemoveItem}
        confirmationInfo={
          "Are you sure you want to remove : " +
          selectedItemId?.itemName +
          " with " +
          formatQuantityByUnit(
            selectedItemId?.poItemOrderedQty ?? 0,
            selectedItemId?.itemUnit ?? ""
          ) +
          " ordered quantity?"
        }
        onClose={function (): void {
          setSelectedItem(null);
          setShowDeleteItem(false);
        }}
        isShow={showDeleteItem}
      />
    </div>
  );
};

export default ShowAllIItems;
