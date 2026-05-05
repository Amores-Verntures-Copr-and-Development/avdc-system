import Button from "@/components/shared/Button";
import { DisplayPOItemsSupplier } from "@/dtos/purchase.dto";
import { formatPeso } from "@/utils/formatPeso";
import {
  Check,
  Package,
  PackageCheck,
  PackageMinus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

import Table, { Column } from "@/components/shared/Table";
import { getPurchaseStatusOption } from "@/utils/purchaserOrderUtils";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import IconButton from "@/components/shared/IconButton";

import ConfirmationModal from "@/components/shared/ConfirmationModal";

interface ReceivedComponentProps {
  onReceivePO: (data: DisplayPOItemsSupplier[]) => Promise<boolean>;
  supplier: DisplayPOItemsSupplier;
  originalData: DisplayPOItemsSupplier;
  expandedSupplier: number | null;
  setExpandedSupplier: React.Dispatch<React.SetStateAction<number | null>>;
  onMaskAsDeliverdSupplier: (data: DisplayPOItemsSupplier) => Promise<boolean>;
  mutateInventory: () => void;
  poCreatedBy: number;
}

const ReceivedComponent = ({
  supplier,
  originalData,
  mutateInventory,
  onMaskAsDeliverdSupplier,
  onReceivePO,
  poCreatedBy,
}: ReceivedComponentProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [supplierReceivedData, setSupplierReceivedData] = useState<
    DisplayPOItemsSupplier[] | null
  >(null);

  const [isShowReceivedConfirm, setIsShowReceivedConfirm] = useState(false);

  const [supplierData, setSupplierData] =
    useState<DisplayPOItemsSupplier>(supplier);
  const [isAdjustReceive, setIsAdjustReceive] = useState<{
    poItemId: number;
    prevQty: number;
  } | null>(null);
  const columns: Column<PurchaseOrderItems>[] = [
    { name: "Item Name", key: "itemName" },
    { name: "Unit", key: "itemUnit" },
    {
      name: "Ordered Qty",
      key: "poItemOrderedQty",
      selector: (row) =>
        formatQuantityByUnit(row.poItemOrderedQty, row.itemUnit ?? ""),
    },
    {
      name: "Received Qty",
      key: "poItemReceivedQty",
      editable: (row) =>
        row.poItemStatus === "sent" ||
        isAdjustReceive?.poItemId === row.poItemId,
      inputType: "number",
      selector: (row) =>
        row.poItemStatus === "not_ordered" ? 0 : row.poItemReceivedQty,
      value: (row) =>
        row.poItemStatus === "not_ordered"
          ? 0
          : Number(row.poItemReceivedQty) || "",
    },
    {
      name: "Price",
      key: "unitPrice",
      selector: (row) => formatPeso(row.unitPrice),
    },
    {
      name: "Total",
      key: "total",
      selector: (row) =>
        row.poItemStatus === "not_ordered"
          ? 0
          : formatPeso(
              (row.supplierPrice || row.unitPrice) *
                (row.poItemReceivedQty > 0
                  ? row.poItemReceivedQty
                  : row.poItemOrderedQty),
            ),
      compute: (row) => {
        return row.poItemReceivedQty * (row.supplierPrice || row.unitPrice);
      },
      dependsOn: ["poItemOrderedQty", "unitPrice", "supplierPrice"],
    },
    {
      name: "Status",
      key: "poItemStatus",
      editable: (row) => {
        // const origData = originalData?.find(
        //   (item) => item.suppId === row.suppId,
        // )?.items;

        const origStatus = originalData?.items.find(
          (item) => item.poItemId === row.poItemId,
        )?.poItemStatus;
        return origStatus !== "not_ordered" && origStatus !== "received";
      },
      selector: (row) => {
        const { bg, color, label } = getPurchaseStatusOption(
          row.poItemStatus ?? "",
        );
        return (
          <div className={`${bg} ${color} text-center py-1 px-.5 rounded-sm`}>
            <span>{label}</span>
          </div>
        );
      },
      inputType: "select",
      selectOptionVariant: "custom", // ✅ matches interface
      options: (row) => {
        const origStatus = originalData?.items.find(
          (item) => item.poItemId === row.poItemId,
        )?.poItemStatus;
        const { label, value, bg, color, border, dot } =
          getPurchaseStatusOption(origStatus ?? "");
        return [
          { label, value, bg, color, border, dot },
          {
            label: "Not Ordered",
            value: "not_ordered",
            bg: "bg-red-100",
            color: "text-red-600",
            border: "border-red-1/50",
            dot: "bg-red-500",
          },
        ];
      },
      value: (row) => row.poItemStatus,
    },
  ];
  const isSupplierItemsSent = supplier.items.some(
    (item) => item.poItemStatus === "sent",
  );

  const validForReceived = originalData?.items.some(
    (item) => item.poItemStatus === "sent",
  );
  const isAllNotOrdered = originalData?.items.every(
    (item) => item.poItemStatus === "not_ordered",
  );

  // const isNotOrderedAll = originalData?.items.every(
  //   (item) => item.poItemStatus === "not_ordered",
  // );

  // const isSupplierItemsDelivered = supplier.items.every(
  //   (item) => item.poItemStatus === "delivered",
  // );
  const handleReceivePO = async (row: DisplayPOItemsSupplier[]) => {
    setIsSubmitting(true);
    try {
      const success = await onReceivePO(row);
      if (success) {
        setSupplierReceivedData(null);
        setIsShowReceivedConfirm(false);
      }
    } catch (e) {
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };
  // const isExpanded = expandedSupplier === supplier.suppId;
  const updateSupplierItems = (newItems: PurchaseOrderItems[]) => {
    setSupplierData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };
  const handleAutoFillAll = () => {
    setSupplierData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.poItemStatus === "received") {
          return { ...item };
        }
        return {
          ...item,
          poItemReceivedQty:
            item.poItemStatus === "not_ordered"
              ? 0
              : Number(item.poItemOrderedQty),
        };
      }),
    }));
  };

  const handleAdjustReceivedQty = async (
    poItem: Partial<PurchaseOrderItems>,
  ) => {
    try {
      console.log({ poItem });

      const res = await fetch(
        `/api/purchase-order/${poItem.poId}/${poItem.poItemId}/adjust-received/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(poItem),
        },
      );

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message);
      }
      setIsAdjustReceive(null);
      toast.success(result.message);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const [selectSupplierNotOrder, setSelectSupplierNotOrder] =
    useState<DisplayPOItemsSupplier | null>(null);
  const [isSubmittingNotOrder, setIsSubmittingNotOrder] = useState(false);
  const handleNotOrderedSupplier = async (data: DisplayPOItemsSupplier) => {
    const hasItemForUnordered = data.items.some(
      (poi) => poi.poItemStatus === "sent",
    );

    if (!hasItemForUnordered) {
      toast.error("No item to be not orded!");
      return;
    }
    const newData: DisplayPOItemsSupplier = {
      ...data,
      items: data.items.filter((poi) => poi.poItemStatus === "sent"),
    };
    setIsSubmittingNotOrder(true);
    try {
      const success = await onMaskAsDeliverdSupplier(newData);
      if (success) {
        mutateInventory();
        setSelectSupplierNotOrder(null);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsSubmittingNotOrder(false);
    }
  };
  return (
    <div className="flex flex-1 flex-col h-full">
      <Table
        maxHeight="h-full"
        uniqueIdKey="itemId"
        localSearch={true}
        textSize="xs"
        columns={columns}
        data={supplierData.items}
        isRounded={false}
        showActions
        updateData={(newData) => updateSupplierItems(newData)}
        // loading={isLoading}
        renderTopActions={
          <div className="flex gap-2">
            {!isAllNotOrdered && (
              <div>
                <Button
                  hasBorder
                  color="neutral"
                  size="xs"
                  onClick={() => {
                    // setShowAddItem(true);
                    // setSelectedSupplierToAdd(supplier);
                  }}
                  label="Add Item"
                  icon={Package}
                />
              </div>
            )}
            {isSupplierItemsSent && (
              <div>
                <Button
                  color="success"
                  hasBorder
                  size="xs"
                  onClick={() => handleAutoFillAll()}
                  label="Auto-Fill All"
                  icon={PackageCheck}
                  className="font-semibold text-white text-xs"
                />
              </div>
            )}
            {validForReceived && (
              <div>
                <Button
                  color="danger"
                  hasBorder
                  size="xs"
                  onClick={() =>
                    // handleNotOrderedSupplier(supplier)
                    setSelectSupplierNotOrder(supplier)
                  }
                  label="Mark as Unordered"
                  icon={PackageMinus}
                  className="font-semibold text-white text-xs"
                />
              </div>
            )}
            {validForReceived && (
              <div>
                {" "}
                <Button
                  size="xs"
                  hasBorder
                  onClick={() => {
                    // handleReceivePO([supplier]);
                    // const hasNoQuantityDelivered = supplier.items.some(
                    //   (item) =>
                    //     item.poItemStatus !== "not_ordered" &&
                    //     Number(item.poItemReceivedQty) === 0,
                    // );

                    // if (hasNoQuantityDelivered) {
                    //   toast.error(
                    //     "There are items to be received with no quantity!",
                    //   );
                    //   return;
                    // }
                    if (supplier) {
                      setIsShowReceivedConfirm(true);
                      setSupplierReceivedData([supplierData]);
                    }
                  }}
                  color="primary"
                  label="Receive PO"
                  icon={Package}
                  className="font-semibold"
                />
              </div>
            )}
          </div>
        }
        renderActions={(row) =>
          row.poItemStatus === "sent" ? (
            <IconButton
              icon={<PackageCheck size={18} />}
              onClick={() => {
                if (!row.suppId) {
                  return;
                }
                // handleAutoFill(row.suppId, row.poItemId);
              }}
              label="Auto-Fill Received Qty"
              bg="primary"
            />
          ) : row.poItemStatus === "received" ? (
            isAdjustReceive?.poItemId === row.poItemId ? (
              <div className="flex gap-2 items-center justify-center">
                <IconButton
                  icon={<X size={18} />}
                  onClick={() => {
                    if (!row.suppId) {
                      return;
                    }
                    console.log({ isAdjustReceive });
                    setSupplierData((prev) => ({
                      ...prev,
                      items: prev.items.map((item) => {
                        if (
                          item.suppId === row.suppId &&
                          item.poItemId === row.poItemId
                        ) {
                          return {
                            ...item,
                            poItemReceivedQty: isAdjustReceive.prevQty, // or whatever value you want
                          };
                        }
                        return item;
                      }),
                    }));

                    setIsAdjustReceive(null);
                  }}
                  label="Cancel Adjust"
                  bg="red"
                />
                <IconButton
                  icon={<Check size={18} />}
                  onClick={() => {
                    const poItem: Partial<PurchaseOrderItems> & {
                      poCreatedBy: number;
                    } = {
                      poItemId: row.poItemId,
                      poId: row.poId,
                      poItemReceivedQty: row.poItemReceivedQty,
                      itemId: row.itemId,
                      poCreatedBy: poCreatedBy,
                    };
                    handleAdjustReceivedQty(poItem);
                  }}
                  label="Confirm Adjust"
                  bg="green"
                />
              </div>
            ) : (
              <IconButton
                icon={<PackageMinus size={18} />}
                onClick={() => {
                  if (!row.suppId) {
                    return;
                  }
                  if (isAdjustReceive !== null) {
                    toast.error("Finish the current adjustment first");
                    return;
                  }
                  setIsAdjustReceive({
                    poItemId: row.poItemId,
                    prevQty: row.poItemReceivedQty,
                  });
                }}
                label="Adjust Received Qty"
                bg="secondary"
              />
            )
          ) : (
            <></>
          )
        }
      />
      <ConfirmationModal
        onConfirm={() => {
          if (selectSupplierNotOrder) {
            handleNotOrderedSupplier(selectSupplierNotOrder);
          }
        }}
        confirmationInfo={`Are you sure you want to mark as not ordered items from ${selectSupplierNotOrder?.suppName}`}
        onClose={() => {
          setSelectSupplierNotOrder(null);
        }}
        isShow={selectSupplierNotOrder !== null}
        isLoading={isSubmittingNotOrder}
      />
      <ConfirmationModal
        onConfirm={() => {
          if (supplierReceivedData) {
            handleReceivePO(supplierReceivedData);
          }
        }}
        confirmationInfo={`Are you sure you want to received items from ${supplierReceivedData?.[0].suppName}`}
        onClose={() => {
          setIsShowReceivedConfirm(false);
          setSupplierReceivedData(null);
        }}
        isShow={isShowReceivedConfirm}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default ReceivedComponent;
