import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";

import Table, { Column } from "@/components/shared/Table";
import {
  CreatePurchaseOrderItemDto,
  DeliverItemsToStore,
  DisplayPOItemsSupplier,
  DisplayPurchaseOrderItemsDto,
} from "@/dtos/purchase.dto";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";
import { formatPeso } from "@/utils/formatPeso";
import {
  Package,
  Edit,
  PrinterIcon,
  Download,
  Check,
  ChevronUp,
  ChevronDown,
  Clock,
  PackageCheck,
  Truck,
  Store,
  Loader2,
  PackageMinus,
  Layers2,
  Replace,
  RefreshCw,
  Hand,
  Eye,
  Menu,
  File,
  Send,
  FileText,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DeliverItemStoreModal from "./_components/DeliverItemStoreModal";
import Popup from "@/components/shared/Popup";
import useSWR from "swr";
import { StoreSupplierDetails } from "./ApprovedPOView";
import { fetcher } from "@/utils/fetcher";
import StoreCardInSupplier from "./_components/StoreCardInSupplier";
import Modal from "@/components/shared/Modal";
import { Supplier } from "@/types/supplier";
import { RequestItems } from "@/types/request";
import { getStatusOption } from "./CompletePOView";
import AddItemToPoSupplier from "./_components/AddItemToPoSupplier";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import { getPurchaseStatusOption } from "@/utils/purchaserOrderUtils";

import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import ViewCompositePOItem from "./_components/ViewCompositePOItem";

import { PortalDropdown } from "@/components/shared/PortalDropDown";
import ReplacePOItemComponent from "./_components/ReplacePOItemComponent";
import UpdatePOItemStatus from "./_components/UpdatePOItemStatus";
import { ItemInterface } from "@/types/items";
import UpdateSupplierPrice from "./_components/UpdateSupplierPrice";
import { PDFViewer } from "@react-pdf/renderer";
import POSupplierItemsPDF from "@/components/pdf/POSupplierItemsPDF";
import POSuppliersPDF from "@/components/pdf/POSuppliersPDF";
import { PurchaseOrderPDF } from "@/components/pdf/PurchaseOrderPDF";
import { formatDateToWords } from "@/utils/formatDateToWords";

export const storeColumns: Column<RequestItems>[] = [
  { name: "#", key: "#", selector: (row, index) => index + 1 },
  { name: "Item Name", key: "itemName" },
  { name: "Unit", key: "itemUnit" },
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

interface ReceivedPOViewProps {
  data: DisplayPOItemsSupplier[];
  onReceivePO: (data: DisplayPOItemsSupplier[]) => Promise<boolean>;
  isLoading?: boolean;
  poId: number;
  poData: PurchaseOrders | null;
  onClose: () => void;
  mutateInventory: () => void;
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request" | "supplier">
  >;
  onAddItemPOSupplier: ({
    data,
    poId,
    secondSubmit,
    continueInsert,
  }: {
    data: CreatePurchaseOrderItemDto;
    poId: number;
    secondSubmit?: boolean;
    continueInsert?: boolean;
  }) => Promise<{
    isSuccess: boolean;
    isAllDelivered: boolean;
  }>;
  onAddItem: (
    data: CreatePurchaseOrderItemDto[],
    poId: number,
  ) => Promise<boolean>;
  onMaskAsDeliverdSupplier: (data: DisplayPOItemsSupplier) => Promise<boolean>;
  onSendPOItem: (data: PurchaseOrderItems[]) => Promise<boolean>;
}

export interface StoreInSupplierDetails {
  data: StoreSupplierDetails;
  supplier: Supplier;
}
const ReceivedPOView: React.FC<ReceivedPOViewProps> = ({
  data,
  onReceivePO,
  isLoading,
  poId,
  poData,
  onAddItemPOSupplier,
  mutateInventory,
  setShowAllItems,
  onMaskAsDeliverdSupplier,
  onSendPOItem,
}) => {
  const [sendingSupplierId, setSendingSupplierId] = useState<number | null>(
    null,
  );
  const [sendConfirmTarget, setSendConfirmTarget] = useState<{
    supplier: DisplayPOItemsSupplier;
    selected?: PurchaseOrderItems[];
  } | null>(null);
  const [isShowUpdateStatusConfirm, setIsShowUpdateStatusConfirm] =
    useState(false);
  const [addPoItem, setAddPOItem] = useState<{
    poItem: CreatePurchaseOrderItemDto;
    item: ItemInterface;
  } | null>();
  const [isShowUpdateSuppPrice, setIsShowUpdateSuppPrice] =
    useState<PurchaseOrderItems | null>(null);

  const [isShowContinueInsertPO, setIsShowContinueInsertPO] = useState(false);
  const [selectedPOItemRows, setSelectedPOItemRows] = useState<
    PurchaseOrderItems[] | null
  >(null);
  const [showReplaceItem, setShowReplaceItem] =
    useState<PurchaseOrderItems | null>(null);
  const [deliverPOItems, setDeliverPOItems] = useState<
    PurchaseOrderItems[] | null
  >(null);
  const [showComponent, setShowComponent] = useState(false);
  const [showCompositeItem, setShowCompositeItem] =
    useState<DisplayPurchaseOrderItemsDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingNotOrder, setIsSubmittingNotOrder] = useState(false);
  const [selectedSupplierToAdd, setSelectedSupplierToAdd] =
    useState<DisplayPOItemsSupplier | null>(null);
  const [originalData, setOriginalData] = useState<
    DisplayPOItemsSupplier[] | null
  >(null);
  const [selectedSupplier, setSelectedSupplier] =
    useState<DisplayPOItemsSupplier | null>(null);
  const [showROPDF, setShowROPDF] = useState<
    "po" | "supplier" | "store" | "suppliers" | null
  >(null);
  const [isShowReceivedConfirm, setIsShowReceivedConfirm] = useState(false);
  const [supplierReceivedData, setSupplierReceivedData] = useState<
    DisplayPOItemsSupplier[] | null
  >(null);
  const [selectSupplierNotOrder, setSelectSupplierNotOrder] =
    useState<DisplayPOItemsSupplier | null>(null);
  const [supplierData, setSupplierData] =
    useState<DisplayPOItemsSupplier[]>(data);
  const [isView, setIsView] = useState<"all" | "store">("all");
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);
  const [isShowDeliverConfirmation, setIsShowDeliverConfirmation] =
    useState(false);
  const [renderPDF, setRenderPDF] = useState(false);
  const [showDeliverToStore, setShowDeliverToStore] =
    useState<DisplayPOItemsSupplier | null>(null);
  const [selectedStoreSupplier, setSelectedStoreSupplier] =
    useState<StoreInSupplierDetails | null>(null);
  const { data: itemResponse = { data: [] }, mutate } = useSWR<{
    data: StoreSupplierDetails[];
  }>(
    isView === "store" && expandedSupplier
      ? `/api/purchase-order/${poData?.poId}/suppliers/${expandedSupplier}`
      : null,
    fetcher,
  );
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
      selector: (row) => row.unitPrice,
    },
    {
      name: "Supplier Price",
      key: "supplierPrice",
      selector: (row) => row.supplierPrice,
      editable: (row) => row.poItemStatus === "sent",
      inputType: "number",
    },
    {
      key: "composite",
      name: "Composite",
      selector: (row) => {
        const composite = row.composite || [];
        const filtered = composite.filter((c) => c !== null);

        if (filtered.length === 0) return null;
        return (
          <PortalDropdown
            trigger={
              <select
                className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
                disabled
              >
                <option>{`Items (${filtered.length})`}</option>
              </select>
            }
          >
            {filtered.map((c, index) => {
              const total = Number(c.ordComQuantity) * Number(c.ordComPrice);
              return (
                <div
                  key={index}
                  className="px-3 py-2 text-[10px] xl:text-xs hover:bg-gray-100 cursor-default border-b last:border-b-0"
                >
                  <div className="font-semibold text-gray-800">
                    {c.itemName}
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Qty: {c.ordComQuantity}</span>
                    <span>Unit: {formatPeso(c.ordComPrice)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-800 mt-1">
                    <span>Total</span>
                    <span>{formatPeso(total)}</span>
                  </div>
                </div>
              );
            })}
          </PortalDropdown>
        );
      },
    },
    {
      name: "Total",
      key: "total",
      selector: (row) => {
        const hasComposite = row.composite && row.composite.length > 0;

        if (row.poItemStatus === "not_ordered") return formatPeso(0);

        if (hasComposite) {
          const total = row?.composite
            ?.filter((c) => c !== null)
            .reduce((sum, item) => {
              return (
                sum + Number(item.ordComQuantity) * Number(item.ordComPrice)
              );
            }, 0);

          return formatPeso(total);
        }

        const qty =
          row.poItemReceivedQty > 0
            ? row.poItemReceivedQty
            : row.poItemOrderedQty;

        const price = row.supplierPrice || row.unitPrice;

        return formatPeso(Number(price) * Number(qty));
      },
      compute: (row) => {
        const hasComposite = row.composite && row.composite.length > 0;
        if (hasComposite) {
          const total = row.composite?.reduce((total, item) => {
            const subtotal = item.ordComQuantity * item.itemPrice;
            return (total += subtotal);
          }, 0);
          return `${formatPeso(total)}`;
        }
        return row.poItemReceivedQty * (row.supplierPrice || row.unitPrice);
      },
      dependsOn: ["poItemOrderedQty", "unitPrice", "supplierPrice"],
    },
    {
      name: "Status",
      key: "poItemStatus",
      editable: (row) => {
        const origData = originalData?.find(
          (item) => item.suppId === row.suppId,
        )?.items;
        const origStatus = origData?.find(
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
        const origData = originalData?.find(
          (item) => item.suppId === row.suppId,
        )?.items;
        const origStatus = origData?.find(
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
  const updateSupplierItems = (
    suppId: number,
    newItems: PurchaseOrderItems[],
  ) => {
    setSupplierData((prev) =>
      prev.map((supplier) =>
        supplier.suppId === suppId
          ? { ...supplier, items: newItems }
          : supplier,
      ),
    );
  };

  useEffect(() => {
    if (data && data.length > 0) {
      setOriginalData(data);
      setSupplierData(data);
    }
  }, [data]);
  useEffect(() => {
    if (showROPDF !== null) {
      setRenderPDF(false);

      const timer = setTimeout(() => {
        setRenderPDF(true);
      }, 100); // allow modal to open first

      return () => clearTimeout(timer);
    }
  }, [showROPDF]);
  // ✅ Auto-fill for one supplier (one row)
  const handleAutoFill = (suppId: number, poItemId: number) => {
    setSupplierData((prev) =>
      prev.map((supplier) => {
        if (supplier.suppId !== suppId) return supplier;

        return {
          ...supplier,
          items: supplier.items.map((item) =>
            item.poItemId === poItemId
              ? {
                  ...item,
                  poItemReceivedQty: item.poItemOrderedQty,
                }
              : item,
          ),
        };
      }),
    );
  };
  const handleSelectionChange = (selected: PurchaseOrderItems[]) => {
    // 👉 Here you can trigger bulk delete, bulk approve, etc.
    setSelectedPOItemRows(selected);
  };
  const handleSendBySupplier = async (
    supplier: DisplayPOItemsSupplier,
    selected?: PurchaseOrderItems[],
  ) => {
    if (sendingSupplierId !== null) return;

    const pendingItems =
      selected && selected.length > 0
        ? selected
        : supplier.items.filter((item) => item.poItemStatus === "pending");

    if (pendingItems.length === 0) {
      toast.error("No pending items to send!");
      return;
    }

    setSendingSupplierId(supplier.suppId);
    try {
      const success = await onSendPOItem(pendingItems);
      if (success) {
        toast.success(`Pending items for ${supplier.suppName} sent!`);
        mutateInventory();
      }
    } finally {
      setSendingSupplierId(null);
    }
  };
  const handleNotOrderedSupplier = async (data: DisplayPOItemsSupplier) => {
    const hasItemForUnordered = data.items.some(
      (poi) =>
        poi.poItemStatus === "sent" || poi.poItemStatus === "not_ordered",
    );

    if (!hasItemForUnordered) {
      toast.error("No item to be not orded!");
      return;
    }
    const newData: DisplayPOItemsSupplier = {
      ...data,
      items: data.items.filter(
        (poi) =>
          poi.poItemStatus === "sent" || poi.poItemStatus === "not_ordered",
      ),
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
  // ✅ Auto-fill all rows for one supplier
  const handleAutoFillAll = (suppId: number) => {
    setSupplierData((prev) =>
      prev.map((supplier) =>
        supplier.suppId === suppId
          ? {
              ...supplier,
              items: supplier.items.map((item) => ({
                ...item,
                poItemReceivedQty:
                  item.poItemStatus === "not_ordered"
                    ? 0
                    : item.poItemOrderedQty,
              })),
            }
          : supplier,
      ),
    );
  };
  const handleUpdatePOStatus = async () => {
    if (!showUpdateStatusButton) {
      toast.error("Cannot update status base on po items!");
      return;
    }
    setIsUpdating(true);
    try {
      if (!poData) {
        return;
      }
      const poDataOrder: Partial<PurchaseOrders> = {
        poId: poData?.poId,
      };
      const newData = {
        data: poDataOrder,
        controller: "received",
      };

      const result = await fetch(`/api/purchase-order/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(`${poData.poNumber} status updated successfully`);
      mutate();
      mutateInventory();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUpdating(false);
    }
  };
  const handleDeliverItemStore = async (data: DeliverItemsToStore) => {
    try {
      const result = await fetch(`api/purchase-order/deliver/${data.storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      mutateInventory();

      setIsShowDeliverConfirmation(false);
      setSelectedStoreSupplier(null);
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to process deliver.");
      return false;
    }
  };
  // const isAllItemsDelivered = data.every((po) =>
  //   po.items.every((item) => item.poItemStatus === "delivered"),
  // );

  const handleSubmitAddItemToSupplierPO = async ({
    dataItem,
    item,
    secondSubmit,
    continueInsert,
  }: {
    dataItem: CreatePurchaseOrderItemDto;
    item: ItemInterface | null;
    secondSubmit?: boolean;
    continueInsert?: boolean;
  }) => {
    const existingSupplier = supplierData.find((supp) =>
      supp.items.some((item) => item.itemId === dataItem.itemId),
    );

    if (existingSupplier) {
      toast.error(
        `Item already in ${existingSupplier.suppName}, change the supplier in View All Item!`,
      );
      return false;
    }
    setIsSubmitting(true);
    try {
      const success = await onAddItemPOSupplier({
        data: dataItem,
        poId,
        secondSubmit,
        continueInsert,
      });

      if (success.isSuccess) {
        if (success.isAllDelivered) {
          setShowAddItem(false);
          setSelectedSupplierToAdd(null);
          setIsShowContinueInsertPO(true);
          setAddPOItem({ poItem: dataItem, item: item! });
          return true;
        } else {
          setShowAddItem(false);
          setSelectedSupplierToAdd(null);
          setIsShowContinueInsertPO(false);
          return true;
        }
      } else {
        return false;
      }
    } catch (e) {
      console.log(e);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  const showUpdateStatusButton = supplierData.flatMap((supp) =>
    supp.items.flatMap(
      (i) => !["pending", "sent"].includes(i.poItemStatus ?? ""),
    ),
  );
  return (
    <div className="gap-5 bg-white rounded-lg h-full flex flex-col overflow-hidden">
      <div className="flex p-1  flex-col h-full w-full overflow-hidden">
        <div className="text-center mt-1 2xl:mt-4 mb-1 2xl:mb-2 2xl:space-y-2 flex-shrink-0">
          <p className="text-gray-700 text-xs font-semibold 2xl:text-sm">
            Review PO and send to suppliers
          </p>
          <p className="text-gray-500 text-xs 2xl:text-xs">
            Review your purchase order and send it to the selected suppliers.
          </p>
        </div>

        <div className="flex flex-1 flex-col p-4 overflow-hidden min-h-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800  text-sm 2xl:text-md flex-shrink-0">
              Order Items by Supplier
            </h3>
            <div className="flex gap-2">
              <div className="self-center">
                <Button
                  color="neutral"
                  size="sm"
                  label="Supplier View"
                  onClick={() => {
                    setShowAllItems("supplier");
                    setSelectedStoreSupplier(null);
                  }}
                  icon={Eye}
                />
              </div>
              <div className="self-center">
                <Button
                  color="neutral"
                  size="sm"
                  label="View All PO Item"
                  icon={Menu}
                  onClick={() => {
                    setShowAllItems("all");
                    setSelectedStoreSupplier(null);
                  }}
                />
              </div>
              <div className="self-center">
                <Button
                  color="neutral"
                  size="sm"
                  label="View PO Request"
                  onClick={() => {
                    setShowAllItems("request");
                  }}
                  icon={File}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-2 h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary-1" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {supplierData.map((supplier, index) => {
                  const isSupplierItemsSent = supplier.items.some(
                    (item) => item.poItemStatus === "sent",
                  );
                  const origData = originalData?.find(
                    (d) => d.suppId === supplier.suppId,
                  )?.items;

                  const validForReceived = origData?.some(
                    (item) => item.poItemStatus === "sent",
                  );
                  const isAllNotOrdered = origData?.every(
                    (item) => item.poItemStatus === "not_ordered",
                  );

                  const isNotOrderedAll = origData?.every(
                    (item) => item.poItemStatus === "not_ordered",
                  );

                  const isSupplierItemsDelivered = supplier.items.every(
                    (item) => item.poItemStatus === "delivered",
                  );

                  const hasPendingItems = supplier.items.some(
                    (item) => item.poItemStatus === "pending",
                  );

                  const isExpanded =
                    expandedSupplier === supplier.suppId &&
                    expandedSupplier !== null;
                  const totalItemsSupplier = supplier.items
                    .filter(
                      (i) =>
                        i.poItemStatus === "received" ||
                        i.poItemStatus === "delivered" ||
                        i.poItemStatus === "received_store",
                    )
                    .reduce((total, item) => {
                      // skip not_ordered (extra safety)
                      if (item.poItemStatus === "not_ordered") return total;

                      const price =
                        Number(item.supplierPrice || item.unitPrice) || 0;

                      const qty = Number(
                        item.poItemReceivedQty > 0
                          ? item.poItemReceivedQty
                          : item.poItemOrderedQty,
                      );

                      return total + price * qty;
                    }, 0);
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 shadow  rounded-lg overflow-hidden flex flex-col"
                    >
                      <div className="bg-gradient-to-r flex flex-col gap-2  bg-white p-2 cursor-pointer hover:from-gray-100 transition overflow-visible">
                        <div className="flex justify-between overflow-visible">
                          <div className="flex items-start gap-2">
                            <Package className="text-primary-1" size={24} />
                            <div className="flex flex-col items-start gap-1">
                              <h1 className="font-semibold text-sm">
                                {supplier.suppName}
                              </h1>
                              <div className="flex text-xs text-gray-600 gap-4">
                                {supplier.suppAddress && (
                                  <span>Location: {supplier.suppAddress}</span>
                                )}
                                {supplier.suppEmail && (
                                  <span>Email: {supplier.suppEmail}</span>
                                )}
                                {supplier.suppPhone && (
                                  <span>Phone: {supplier.suppPhone}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-4">
                            <div className="flex flex-col gap-2 items-end">
                              <span className="text-[9px] xl:text-xs">
                                Total Amount
                              </span>
                              <p className="font-bold text-primary-1 text-sm xl:text-lg">
                                {formatPeso(totalItemsSupplier)}
                              </p>
                              <span className="text-[9px] xl:text-xs">
                                {supplier.items.length} item(s)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-300"></div>
                        <div className="flex justify-between mt-5">
                          <div className="flex gap-2">
                            <div>
                              <Button
                                size="xs"
                                color="secondary"
                                label="PDF"
                                icon={Download}
                                className="font-semibold text-gray-700 text-xs"
                                onClick={() => {
                                  setSelectedSupplier(supplier);
                                  setShowROPDF("supplier");
                                }}
                              />
                            </div>
                            {hasPendingItems && (
                              <div>
                                <Button
                                  size="xs"
                                  color="secondary"
                                  label="Send"
                                  icon={Send}
                                  loading={
                                    sendingSupplierId === supplier.suppId
                                  }
                                  disabled={
                                    sendingSupplierId !== null &&
                                    sendingSupplierId !== supplier.suppId
                                  }
                                  className="font-semibold text-gray-700 text-xs"
                                  onClick={() =>
                                    setSendConfirmTarget({ supplier })
                                  }
                                />
                              </div>
                            )}
                            {validForReceived ? (
                              <>
                                <div>
                                  <Button
                                    size="xs"
                                    onClick={() => {
                                      // handleReceivePO([supplier]);
                                      const hasNoQuantityDelivered =
                                        supplier.items.some(
                                          (item) =>
                                            item.poItemStatus !==
                                              "not_ordered" &&
                                            Number(item.poItemReceivedQty) ===
                                              0,
                                        );

                                      if (hasNoQuantityDelivered) {
                                        toast.error(
                                          "There are items to be received with no quantity!",
                                        );
                                        return;
                                      }

                                      if (supplier) {
                                        setIsShowReceivedConfirm(true);
                                        setSupplierReceivedData([supplier]);
                                      }
                                    }}
                                    color="primary"
                                    label="Receive PO"
                                    icon={Package}
                                    className="font-semibold"
                                  />
                                </div>
                              </>
                            ) : isSupplierItemsDelivered ? (
                              <>
                                <div>
                                  {" "}
                                  <div>
                                    {" "}
                                    <Button
                                      size="xs"
                                      onClick={() => {
                                        setShowDeliverToStore(supplier);
                                      }}
                                      disabled={true}
                                      color="success"
                                      label="Delivered"
                                      icon={Check}
                                      className="font-semibold"
                                    />
                                  </div>
                                </div>
                              </>
                            ) : isNotOrderedAll ? (
                              <div>
                                {" "}
                                <Button
                                  size="xs"
                                  onClick={() => {
                                    // handleSendBySupplier(supplier.items);
                                    // setIsShowDeliverConfirmation(true);
                                    // setSupplierReceivedData(supplier.items);
                                  }}
                                  color="danger"
                                  label="Not Ordered"
                                  disabled={true}
                                  icon={PackageCheck}
                                  className="font-semibold"
                                />
                              </div>
                            ) : (
                              <div>
                                {" "}
                                <Button
                                  size="xs"
                                  onClick={() => {
                                    // handleSendBySupplier(supplier.items);
                                    // setIsShowDeliverConfirmation(true);
                                    // setSupplierReceivedData(supplier.items);
                                  }}
                                  color="success"
                                  label="Received"
                                  disabled={true}
                                  icon={PackageCheck}
                                  className="font-semibold"
                                />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              setExpandedSupplier(
                                isExpanded ? null : supplier.suppId,
                              )
                            }
                            className="inline-flex items-center px-1 py-.5 xl:px-3 xl:py-1.5 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            {isExpanded ? "Hide Details" : "View Details"}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 ml-2" />
                            ) : (
                              <ChevronDown className="w-4 h-4 ml-2" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-2 flex flex-col h-full gap-2 bg-gray-100/30">
                          <div className="flex items-center">
                            <div>
                              {" "}
                              <Button
                                isRounded={false}
                                size="xs"
                                onClick={function (): void {
                                  setExpandedSupplier(supplier.suppId);
                                  setIsView("all");
                                  setSelectedStoreSupplier(null);
                                }}
                                color={
                                  isView === "all" &&
                                  expandedSupplier === supplier.suppId
                                    ? "primary"
                                    : "secondary"
                                }
                                label="All"
                                icon={Edit}
                                className="font-semibold text-gray-700 text-xs"
                              />
                            </div>
                            <div>
                              {" "}
                              <Button
                                isFocus
                                isRounded={false}
                                size="xs"
                                onClick={function (): void {
                                  setExpandedSupplier(supplier.suppId);
                                  setIsView("store");
                                }}
                                color={
                                  isView === "store" &&
                                  expandedSupplier === supplier.suppId
                                    ? "primary"
                                    : "secondary"
                                }
                                label="Store"
                                icon={Store}
                                className="font-semibold text-gray-700 text-xs"
                              />
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            {selectedStoreSupplier === null ? (
                              isView === "all" ? (
                                <Table
                                  showCheckBox={true}
                                  onSelectionChange={handleSelectionChange}
                                  uniqueIdKey="itemId"
                                  localSearch={true}
                                  textSize="xs"
                                  columns={columns}
                                  data={supplier.items}
                                  isRounded={false}
                                  showActions
                                  updateData={(newData) =>
                                    updateSupplierItems(
                                      supplier.suppId,
                                      newData,
                                    )
                                  }
                                  loading={isLoading}
                                  renderTopActions={
                                    <div className="flex gap-2">
                                      {hasPendingItems &&
                                        (() => {
                                          const selectedPending = (
                                            selectedPOItemRows ?? []
                                          ).filter(
                                            (row) =>
                                              row.poItemStatus === "pending" &&
                                              supplier.items.some(
                                                (item) =>
                                                  item.poItemId ===
                                                  row.poItemId,
                                              ),
                                          );

                                          return (
                                            <div>
                                              <Button
                                                hasBorder
                                                color="secondary"
                                                size="xs"
                                                loading={
                                                  sendingSupplierId ===
                                                  supplier.suppId
                                                }
                                                disabled={
                                                  sendingSupplierId !== null &&
                                                  sendingSupplierId !==
                                                    supplier.suppId
                                                }
                                                onClick={() =>
                                                  setSendConfirmTarget({
                                                    supplier,
                                                    selected: selectedPending,
                                                  })
                                                }
                                                label={
                                                  selectedPending.length > 0
                                                    ? `Send Selected (${selectedPending.length})`
                                                    : "Send Pending"
                                                }
                                                icon={Send}
                                                className="font-semibold text-xs"
                                              />
                                            </div>
                                          );
                                        })()}
                                      {!isAllNotOrdered && (
                                        <div>
                                          <Button
                                            hasBorder
                                            color="neutral"
                                            size="xs"
                                            onClick={() => {
                                              setShowAddItem(true);
                                              setSelectedSupplierToAdd(
                                                supplier,
                                              );
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
                                            onClick={() =>
                                              handleAutoFillAll(supplier.suppId)
                                            }
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
                                              setSelectSupplierNotOrder(
                                                supplier,
                                              )
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
                                              const hasNoQuantityDelivered =
                                                supplier.items.some(
                                                  (item) =>
                                                    item.poItemStatus !==
                                                      "not_ordered" &&
                                                    Number(
                                                      item.poItemReceivedQty,
                                                    ) === 0,
                                                );

                                              if (hasNoQuantityDelivered) {
                                                toast.error(
                                                  "There are items to be received with no quantity!",
                                                );
                                                return;
                                              }

                                              if (supplier) {
                                                setIsShowReceivedConfirm(true);
                                                setSupplierReceivedData([
                                                  supplier,
                                                ]);
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
                                  renderActions={(row) => (
                                    <div className="flex justify-center gap-2">
                                      <IconButton
                                        onClick={() => {
                                          setShowCompositeItem({
                                            poId: row.poId,
                                            itemId: row.itemId,
                                            poItemId: row.poItemId,
                                            poItemOrderedQty:
                                              row.poItemOrderedQty,
                                            poItemReceivedQty:
                                              row.poItemReceivedQty,
                                            unitPrice: row.supplierPrice ?? 0,
                                            suppId: row.suppId,
                                            suppliers: [],
                                            selectedSupplierId: row.suppId,
                                            poItemStatus: row.poItemStatus,
                                            totalPrice: 0,
                                            composite: row.composite,
                                            itemName: row.itemName ?? "",
                                            itemUnit: row.itemUnit ?? "",
                                          });
                                        }}
                                        label="Composite Item"
                                        icon={<Layers2 size={14} />}
                                        bg="gray"
                                      />

                                      {row.poItemStatus === "sent" && (
                                        <IconButton
                                          icon={<PackageCheck size={14} />}
                                          onClick={() => {
                                            if (!row.suppId) {
                                              return;
                                            }
                                            handleAutoFill(
                                              row.suppId,
                                              row.poItemId,
                                            );
                                          }}
                                          label="Auto-Fill Received Qty"
                                          bg="gray"
                                        />
                                      )}
                                      <IconButton
                                        icon={<Replace size={14} />}
                                        onClick={() => {
                                          if (!row) {
                                            return;
                                          }

                                          setShowReplaceItem(row);
                                        }}
                                        label="Replace Item"
                                        bg="green"
                                      />
                                      <IconButton
                                        icon={<Store size={14} />}
                                        onClick={() => {
                                          if (!row) {
                                            return;
                                          }
                                          setIsShowUpdateSuppPrice(row);
                                        }}
                                        label="Update Supplier Price"
                                        bg="tertiary"
                                      />
                                      <IconButton
                                        icon={<Package size={14} />}
                                        onClick={() => {
                                          if (!row) {
                                            return;
                                          }
                                          if (supplier) {
                                            setIsShowReceivedConfirm(true);
                                            setSupplierReceivedData([
                                              {
                                                ...supplier,
                                                items: [
                                                  {
                                                    ...row,
                                                  },
                                                ],
                                              },
                                            ]);
                                          }
                                        }}
                                        label="Receive Item"
                                        bg="primary"
                                      />
                                    </div>
                                  )}
                                />
                              ) : (
                                <div className="flex flex-1 p-2 gap-4 overflow-auto-y">
                                  {itemResponse.data.map((data) => (
                                    <StoreCardInSupplier
                                      data={data}
                                      key={data.storeId}
                                      onClick={(row: StoreSupplierDetails) => {
                                        setSelectedStoreSupplier({
                                          data: row,
                                          supplier: supplier,
                                        });
                                      }}
                                    />
                                  ))}
                                </div>
                              )
                            ) : (
                              <Table
                                title={selectedStoreSupplier.data.storeName}
                                subtitle={`${selectedStoreSupplier.data.items.length} items`}
                                renderTopActions={
                                  !isNotOrderedAll && (
                                    <div>
                                      {" "}
                                      <Button
                                        hasBorder={true}
                                        size="xs"
                                        onClick={() => {
                                          setDeliverPOItems(supplier.items);
                                          setIsShowDeliverConfirmation(true);
                                        }}
                                        color="success"
                                        label="Deliver to Store"
                                        icon={Package}
                                        className="font-semibold"
                                      />
                                    </div>
                                  )
                                }
                                columns={storeColumns}
                                data={selectedStoreSupplier.data.items}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex border-t-1 p-2 justify-between border-gray-200 items-center">
          <span className="flex items-center">
            <Clock size={15} />{" "}
            <span className="text-xs ml-2">
              {" "}
              <span className="text-xs font-semibold">Created:</span>{" "}
              {formatDateToWords(poData?.poCreatedAt ?? "")}
            </span>
          </span>
          <div className="flex gap-3">
            <div>
              <Button
                color="secondary"
                size="sm"
                onClick={function (): void {
                  throw new Error("Function not implemented.");
                }}
                label="Print"
                icon={PrinterIcon}
                className="font-semibold text-gray-700 text-xs px-2 py-2"
              />
            </div>
            <div>
              <Button
                size="sm"
                label="Supplier PDF"
                onClick={() => {
                  setShowROPDF("suppliers");
                }}
                color="outline"
                icon={FileText}
              />
            </div>
            <div className="">
              <Button
                color="secondary"
                size="sm"
                onClick={function (): void {
                  setShowROPDF("po");
                }}
                label="PDF"
                icon={FileText}
                className="font-semibold text-gray-700 text-xs px-2 py-2"
              />
            </div>
            {showUpdateStatusButton && (
              <div className="">
                <Button
                  size="sm"
                  label={"Update Status"}
                  loading={isUpdating}
                  icon={RefreshCw}
                  className="font-semibold text-gray-700 text-xs px-2 py-2"
                  onClick={() => {
                    setIsShowUpdateStatusConfirm(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <Popup
        title="Deliver Item"
        background="transaparent"
        // subtitle="Select store to deliver item"
        isOpen={showDeliverToStore !== null}
        onClose={function (): void {
          setShowDeliverToStore(null);
        }}
      >
        {" "}
        <DeliverItemStoreModal
          data={showDeliverToStore}
          onSubmit={handleDeliverItemStore}
          poId={poId}
          onCancel={() => {
            setShowDeliverToStore(null);
          }}
        />
      </Popup>
      <Modal
        leadingIcon={Truck} // or Shipping
        title="Confirm Delivery"
        isOpen={isShowDeliverConfirmation}
        onClose={function (): void {
          setIsShowDeliverConfirmation(false);
        }}
      >
        <div className="flex flex-col gap-6 p-4">
          <div className="text-center">
            <p className="text-gray-700">
              Deliver {selectedStoreSupplier?.data.items.length} items from{" "}
              <span className="font-semibold">
                {selectedStoreSupplier?.supplier.suppName}
              </span>{" "}
              (Supplier) to{" "}
              <span className="font-semibold">
                {selectedStoreSupplier?.data.storeName}
              </span>{" "}
              (Store)?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button size="sm" label="No, Cancel" color="secondary" />
            <Button
              size="sm"
              label="Yes, Deliver"
              color="primary"
              onClick={() => {
                if (!selectedStoreSupplier) {
                  return;
                }
                const data: DeliverItemsToStore = {
                  storeId: selectedStoreSupplier?.data.storeId ?? 0,
                  poId: poData?.poId ?? 0,
                  requestId: selectedStoreSupplier.data.requestId,
                  items: selectedStoreSupplier?.data.items,
                  poItems:
                    deliverPOItems?.map((poi) => ({
                      itemId: poi.itemId,
                    })) ?? [],
                };
                handleDeliverItemStore(data);
              }}
            />
          </div>
        </div>
      </Modal>
      <Popup
        title={`Add Item to ${selectedSupplierToAdd?.suppName} for PO`}
        background="bg-white/20"
        isOpen={showAddItem}
        onClose={function (): void {
          setShowAddItem(false);
          setSelectedSupplierToAdd(null);
        }}
        closeOnClickOutside={false}
      >
        <AddItemToPoSupplier
          poId={poId}
          supplier={selectedSupplierToAdd}
          onSubmit={handleSubmitAddItemToSupplierPO}
        />
      </Popup>
      <ConfirmationModal
        onConfirm={() => {
          if (supplierReceivedData) {
            handleReceivePO(supplierReceivedData);
          }
        }}
        confirmationInfo={
          supplierReceivedData && supplierReceivedData?.[0].items.length > 1
            ? `Are you sure you want to received items from ${supplierReceivedData?.[0].suppName}`
            : `Are you sure you want to received (${supplierReceivedData?.[0].items[0].poItemReceivedQty})  ${supplierReceivedData?.[0].items[0].itemName} from ${supplierReceivedData?.[0].suppName}`
        }
        onClose={() => {
          setIsShowReceivedConfirm(false);
          setSupplierReceivedData(null);
        }}
        isShow={isShowReceivedConfirm}
        isLoading={isSubmitting}
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
        title="Confirm Send"
        onConfirm={async () => {
          if (!sendConfirmTarget) return;
          await handleSendBySupplier(
            sendConfirmTarget.supplier,
            sendConfirmTarget.selected,
          );
          setSendConfirmTarget(null);
        }}
        confirmationInfo={
          sendConfirmTarget?.selected && sendConfirmTarget.selected.length > 0
            ? `Are you sure you want to send ${sendConfirmTarget.selected.length} selected item(s) to ${sendConfirmTarget.supplier.suppName}?`
            : `Are you sure you want to send all pending items to ${sendConfirmTarget?.supplier.suppName}?`
        }
        onClose={() => {
          setSendConfirmTarget(null);
        }}
        isShow={sendConfirmTarget !== null}
        isLoading={sendingSupplierId !== null}
        confirmLabel="Send"
      />
      <ConfirmationModal
        title="Confirm Update Status"
        onConfirm={async () => {
          await handleUpdatePOStatus();
          setIsShowUpdateStatusConfirm(false);
        }}
        confirmationInfo={`Are you sure you want to update the status for ${poData?.poNumber}?`}
        onClose={() => {
          setIsShowUpdateStatusConfirm(false);
        }}
        isShow={isShowUpdateStatusConfirm}
        isLoading={isUpdating}
        confirmLabel="Update"
      />
      <Popup
        title="Composite Items"
        isOpen={showCompositeItem !== null}
        onClose={function (): void {
          setShowCompositeItem(null);
        }}
        background="bg-white-600"
        closeOnClickOutside={!showComponent}
      >
        <ViewCompositePOItem
          data={showCompositeItem}
          setShowComponent={setShowComponent}
        />
      </Popup>
      <Popup
        isOpen={showReplaceItem !== null}
        onClose={function (): void {
          setShowReplaceItem(null);
        }}
        background="bg-white/20"
        title={`Replace Item`}
        closeOnClickOutside={false}
      >
        <ReplacePOItemComponent
          data={showReplaceItem}
          mutate={async () => {
            mutateInventory();
            mutate();
          }}
          onClose={() => {
            setShowReplaceItem(null);
          }}
        />
      </Popup>
      <Popup
        isOpen={isShowUpdateSuppPrice !== null}
        onClose={function (): void {
          setIsShowUpdateSuppPrice(null);
        }}
        background="bg-white/20"
        title={`Update Supplier Price`}
        closeOnClickOutside={false}
      >
        <UpdateSupplierPrice
          data={isShowUpdateSuppPrice}
          supplierName={
            data.find((s) => s.suppId === isShowUpdateSuppPrice?.suppId)
              ?.suppName ?? ""
          }
          onClose={function (): void {
            setIsShowUpdateSuppPrice(null);
          }}
          mutate={() => {
            mutate();
            mutateInventory();
          }}
        />
      </Popup>
      <Modal
        title="Update Status for PO Items"
        isOpen={false}
        onClose={function (): void {
          throw new Error("Function not implemented.");
        }}
      >
        <UpdatePOItemStatus data={selectedPOItemRows ?? []} />
      </Modal>
      <Modal
        title="Confirmation to automatic delivered item"
        isOpen={isShowContinueInsertPO}
        onClose={function (): void {
          setIsShowContinueInsertPO(false);
        }}
      >
        <div className="flex flex-col justify-center gap-2">
          <span className="items-center text-center text-xs 2xl:text-sm">
            ⚠️{" "}
            <span className="font-semibold">{addPoItem?.item.itemName} </span>
            has already been delivered or received to the stores. If you
            continue, the system will automatically update to delivered its
            status.
          </span>
          <div className="flex justify-end gap-2">
            <div>
              <Button
                label="Insert only"
                color="secondary"
                size="sm"
                onClick={() => {
                  if (!addPoItem) {
                    return;
                  }
                  handleSubmitAddItemToSupplierPO({
                    dataItem: addPoItem?.poItem,
                    item: addPoItem.item,
                    secondSubmit: true,
                    continueInsert: false,
                  });
                }}
                loading={isSubmitting}
              />
            </div>
            <div>
              <Button
                label="Continue and update"
                color="primary"
                size="sm"
                onClick={() => {
                  if (!addPoItem) {
                    return;
                  }
                  handleSubmitAddItemToSupplierPO({
                    dataItem: addPoItem?.poItem,
                    item: addPoItem.item,
                    secondSubmit: true,
                    continueInsert: true,
                  });
                }}
                loading={isSubmitting}
              />
            </div>
          </div>
        </div>
        {/* <UpdatePOItemStatus data={selectedPOItemRows ?? []} /> */}
      </Modal>

      <Modal
        className="h-[95%]"
        isOpen={showROPDF !== null}
        size="xl"
        onClose={function (): void {
          setShowROPDF(null);
        }}
        title="Purchase Order PDF"
      >
        {renderPDF ? (
          <PDFViewer width="100%" height="100%">
            {showROPDF === "supplier" ? (
              <POSupplierItemsPDF data={selectedSupplier!} poData={poData} />
            ) : showROPDF === "suppliers" ? (
              <POSuppliersPDF data={data} poData={poData} />
            ) : (
              <PurchaseOrderPDF
                data={
                  poData && {
                    ...poData,
                    // poData.purchaseOrderItems is never populated by the
                    // backend (only set on create) - the real items live in
                    // this view's own `data` prop, grouped by supplier.
                    purchaseOrderItems: data.flatMap((supp) => supp.items),
                  }
                }
              />
            )}
          </PDFViewer>
        ) : (
          <div className="flex items-center justify-center h-full">
            Generating PDF...
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceivedPOView;
