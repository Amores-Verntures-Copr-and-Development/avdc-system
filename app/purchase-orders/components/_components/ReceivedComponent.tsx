import Button from "@/components/shared/Button";
import { DisplayPOItemsSupplier } from "@/dtos/purchase.dto";
import { formatPeso } from "@/utils/formatPeso";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  Package,
  PackageCheck,
  PackageMinus,
  Store,
} from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { StoreInSupplierDetails } from "../ReceivedPOView";
import Table, { Column } from "@/components/shared/Table";
import { getPurchaseStatusOption } from "@/utils/purchaserOrderUtils";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import IconButton from "@/components/shared/IconButton";
import StoreCardInSupplier from "./StoreCardInSupplier";
import { getStatusOption } from "../CompletePOView";
import { RequestItems } from "@/types/request";
import ConfirmationModal from "@/components/shared/ConfirmationModal";

interface ReceivedComponentProps {
  onReceivePO: (data: DisplayPOItemsSupplier[]) => Promise<boolean>;
  supplier: DisplayPOItemsSupplier;
  originalData: DisplayPOItemsSupplier;
  expandedSupplier: number | null;
  setExpandedSupplier: React.Dispatch<React.SetStateAction<number | null>>;
  onMaskAsDeliverdSupplier: (data: DisplayPOItemsSupplier) => Promise<boolean>;
  mutateInventory: () => void;
}
const storeColumns: Column<RequestItems>[] = [
  { name: "#", key: "#", selector: (row, index) => index + 1 },
  { name: "Item Name", key: "itemName" },
  { name: "Price", key: "itemPrice" },
  { name: "Ordered Qty", key: "reqItemQuantity" },
  {
    name: "Status",
    key: "reqItemStatus",
    selector: (row) => {
      const { label, bg, color } = getStatusOption(row.reqItemStatus);
      return (
        <div
          className={`${bg} w-full px-2 py-1 rounded border border-gray-300 text-left`}
        >
          <span
            className={` ${color} px-2 py-1 text-[9px] xl:text-xs items-center`}
          >
            {label}
          </span>
        </div>
      );
    },
  },
  {
    name: "Remarks",
    key: "reqItemRemarks",
  },
];
const ReceivedComponent = ({
  supplier,
  originalData,
  expandedSupplier,
  setExpandedSupplier,
  mutateInventory,
  onMaskAsDeliverdSupplier,
  onReceivePO,
}: ReceivedComponentProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStoreSupplier, setSelectedStoreSupplier] =
    useState<StoreInSupplierDetails | null>(null);
  const [supplierReceivedData, setSupplierReceivedData] = useState<
    DisplayPOItemsSupplier[] | null
  >(null);
  //   const [supplierData, setSupplierData] =
  //     useState<DisplayPOItemsSupplier[]>(supplier);
  const [isShowReceivedConfirm, setIsShowReceivedConfirm] = useState(false);
  const [isView, setIsView] = useState<"all" | "store">("all");
  const [supplierData, setSupplierData] =
    useState<DisplayPOItemsSupplier>(supplier);
  const [showDeliverToStore, setShowDeliverToStore] =
    useState<DisplayPOItemsSupplier | null>(null);
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
      editable: (row) => row.poItemStatus === "sent",
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
      name: "Supplier Price",
      key: "supplierPrice",
      editable: (row) => row.poItemStatus === "sent",
      inputType: "number",
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

  const isNotOrderedAll = originalData?.items.every(
    (item) => item.poItemStatus === "not_ordered",
  );

  const isSupplierItemsDelivered = supplier.items.every(
    (item) => item.poItemStatus === "delivered",
  );
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
  const isExpanded = expandedSupplier === supplier.suppId;
  const updateSupplierItems = (newItems: PurchaseOrderItems[]) => {
    console.log({ newItems });
    setSupplierData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };
  const handleAutoFillAll = () => {
    console.log("Click");
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
