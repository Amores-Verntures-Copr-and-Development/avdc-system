import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayPOItemsSupplier,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";
import { formatPeso } from "@/utils/formatPeso";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  FileText,
  Loader2,
  Package,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Send,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import StoreCardInSupplier from "./_components/StoreCardInSupplier";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import { RequestItems } from "@/types/request";
import Modal from "@/components/shared/Modal";
import { PDFViewer } from "@react-pdf/renderer";
import POSupplierItemsPDF from "@/components/pdf/POSupplierItemsPDF";
import { PurchaseOrderPDF } from "@/components/pdf/PurchaseOrderPDF";
import ReceivedComponent from "./_components/ReceivedComponent";
import { useSession } from "@/hooks/useSession";
import { getPurchaseStatusOption } from "@/utils/purchaserOrderUtils";
import DynamicDropdown from "@/components/shared/DynamicDropdown";
import POSuppliersPDF from "@/components/pdf/POSuppliersPDF";

interface ApprovedPOViewProps {
  poData: PurchaseOrders | null;
  data: DisplayPOItemsSupplier[];
  onSendPO: (data: DisplayPOItemsSupplier[]) => Promise<boolean>;
  onSendPOItem: (data: PurchaseOrderItems[]) => Promise<boolean>;
  loading: boolean;
  onClose: () => void;
  mutate: () => void;
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request" | "supplier">
  >;
}
export interface RequestItemWithPOItem extends RequestItems {
  poItemId: number;
  storeId?: number;
}

export interface StoreSupplierDetails {
  storeId: number;
  storeName: string;
  requestId: number;
  items: RequestItemWithPOItem[];
}

const columns: Column<PurchaseOrderItems>[] = [
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
    name: "Price",
    key: "unitPrice",
    selector: (row) => formatPeso(row.unitPrice),
  },
  {
    name: "itemUnit",
    key: "itemUnit",
  },
  {
    name: "Quantity",
    key: "poItemOrderedQty",
    selector: (row) =>
      formatQuantityByUnit(row.poItemOrderedQty, row.itemUnit ?? ""),
  },
  {
    name: "Status",
    key: "poItemStatus",
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
      const { label, value, bg, color, border, dot } = getPurchaseStatusOption(
        row.poItemStatus ?? "",
      );
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
  {
    name: "Total",
    key: "total",
    selector: (row: PurchaseOrderItems) =>
      formatPeso(row.poItemOrderedQty * row.unitPrice),
  },
];
const ApprovedPOView: React.FC<ApprovedPOViewProps> = ({
  data,
  onSendPOItem,
  loading,
  poData,
  onClose,
  mutate,
  setShowAllItems,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useSession();
  const [renderPDF, setRenderPDF] = useState(false);
  const [expandedSupplier, setExpandedSupplier] = useState<{
    suppId: number | null;
    index: null | number;
  }>({
    suppId: 0,
    index: null,
  });
  const [showROPDF, setShowROPDF] = useState<
    "po" | "supplier" | "store" | "suppliers" | null
  >(null);
  const [sendingSupplier, setSendingSupplier] = useState<number | null>(null);
  const [isView, setIsView] = useState<"all" | "store">("all");
  const [receivedSupplierItem, setReceivedSupplierItem] =
    useState<DisplayPOItemsSupplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] =
    useState<DisplayPOItemsSupplier | null>(null);
  const { data: itemResponse = { data: [] }, mutate: mutateItems } = useSWR<{
    data: StoreSupplierDetails[];
  }>(
    isView === "store" && expandedSupplier
      ? `/api/purchase-order/${poData?.poId}/suppliers/${expandedSupplier.suppId}`
      : null,
    fetcher,
  );
  const handleSendBySupplier = async (
    poItems: PurchaseOrderItems[],
    suppId: number,
    index: number,
  ) => {
    if (sendingSupplier !== null) return; // already sending

    setSendingSupplier(index);

    try {
      const supplierName = data.find((req) => req.suppId === suppId)?.suppName;
      const success = await onSendPOItem(poItems);

      if (success) {
        toast.success(`Items for ${supplierName} sent!`);

        await mutate(); // wait refresh

        if (
          data.every((req) => req.items.every((i) => i.poItemStatus === "sent"))
        ) {
          onClose();
        }
      }
    } finally {
      setSendingSupplier(null);
    }
  };
  // const handleSendToSupliers = async (data: DisplayPOItemsSupplier[]) => {
  //   const success = await onSendPO(data);
  //   if (success) {
  //     toast.success("Purchase Order successfully sent!");
  //     onClose();
  //   }
  // };
  useEffect(() => {
    if (showROPDF !== null) {
      setRenderPDF(false);

      const timer = setTimeout(() => {
        setRenderPDF(true);
      }, 100); // allow modal to open first

      return () => clearTimeout(timer);
    }
  }, [showROPDF]);

  const handleReceivePO = async (items: DisplayPOItemsSupplier[]) => {
    try {
      const itemData = items.flatMap((i) =>
        i.items.filter(
          (item) =>
            item.poItemStatus === "not_ordered" ||
            (item.poItemStatus === "sent" &&
              Number(item.poItemReceivedQty) !== 0),
        ),
      );
      if (itemData.length === 0) {
        toast.error("No quantity to be received!");
        return false;
      }
      const updatePO: UpdatePurchaseOrdersDto = {
        updatedBy: user?.userId ?? 0,
        poId: poData?.poId,
        poItems: itemData,
      };
      const newData = {
        controller: "received",
        data: updatePO,
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
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(
        `PO Items from ${items[0].suppName} received successfully!`,
      );
      mutate();
      mutateItems();
      setReceivedSupplierItem(null);
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  const handleNotOrderedSupplierItem = async (
    dataSupp: DisplayPOItemsSupplier,
  ) => {
    try {
      const newData = {
        data: dataSupp.items.map((item) => ({
          ...item,
        })),
        controller: "not_ordered",
      };

      const result = await fetch(
        `/api/purchase-order/po-items/${poData?.poId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newData),
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(
        `PO Items from ${dataSupp.suppName} successfully mark as not ordered!`,
      );
      mutateItems();
      mutate();
      setReceivedSupplierItem(null);
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add Inventory.");
      return false;
    }
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
        controller: "sent",
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
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUpdating(false);
    }
  };
  const showUpdateStatusButton = data.flatMap((s) =>
    s.items
      .filter((i) => i.poItemStatus !== "not_ordered")
      .every(
        (i) =>
          i.poItemStatus === "received" ||
          i.poItemStatus === "delivered" ||
          i.poItemStatus === "received_store",
      ),
  );
  return (
    <div className="gap-5 bg-white h-full flex flex-col overflow-hidden">
      <div className="flex p-2 flex-col h-full w-full overflow-hidden">
        <div className="text-center mt-4 mb-2 flex-shrink-0">
          <p className="text-gray-700 text-xs 2xl:text-sm font-medium">
            Review PO and send to suppliers
          </p>
          <p className="text-gray-500 text-xs 2xl:text-sm">
            Review your purchase order and send it to the selected suppliers.
          </p>
        </div>

        {/* Table Section */}
        <div className="flex flex-1 flex-col p-4 overflow-hidden min-h-0">
          <div className="flex justify-between items-center ">
            {" "}
            <h3 className="font-semibold text-gray-800 mb-3 text-lg flex-shrink-0">
              Order Items by Supplier
            </h3>
            <div className="flex gap-2">
              <div>
                <Button
                  size="xs"
                  label="Request"
                  onClick={() => {
                    setShowAllItems("request");
                  }}
                  color="outline"
                />
              </div>
              <div>
                <Button
                  size="xs"
                  label="View all items"
                  onClick={() => {
                    setShowAllItems("all");
                  }}
                  color="outline"
                />
              </div>
            </div>
          </div>
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-2 h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary-1" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {" "}
                {/* Added padding for scrollbar */}
                {data.map((data, index) => {
                  return data.suppId ? (
                    <div
                      className="border border-gray-300 rounded-lg overflow-hidden flex flex-col"
                      key={data.suppId}
                      onClick={() => {
                        setExpandedSupplier({
                          index:
                            expandedSupplier.index === index ? null : index,
                          suppId:
                            expandedSupplier.suppId === data.suppId
                              ? null
                              : data.suppId,
                        });
                      }}
                    >
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 cursor-pointer hover:from-gray-100 hover:to-gray-150 transition flex-shrink-0">
                        <div className="grid grid-cols-12 gap-4 items-center w-full">
                          {/* Supplier Info - 4 columns */}
                          <div className="col-span-4">
                            <div className="flex items-center gap-2">
                              <Package className="text-primary-1" size={24} />
                              <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
                                <h1 className="font-semibold text-sm truncate w-full">
                                  {data.suppName}
                                </h1>
                                <div className="flex text-xs text-gray-600 gap-4 flex-wrap">
                                  {data.suppAddress && (
                                    <span className="truncate max-w-32">
                                      Location: {data.suppAddress}
                                    </span>
                                  )}
                                  {data.suppEmail && (
                                    <span className="truncate max-w-32">
                                      Email: {data.suppEmail}
                                    </span>
                                  )}
                                  {data.suppPhone && (
                                    <span className="truncate">
                                      Phone: {data.suppPhone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* View Buttons - 2 columns */}
                          <div className="col-span-2 flex justify-center">
                            <div className="flex items-center gap-1">
                              <div>
                                <Button
                                  isRounded={false}
                                  size="xs"
                                  onClick={() => {
                                    setExpandedSupplier({
                                      index: index,
                                      suppId: data.suppId,
                                    });
                                    setIsView("all");
                                  }}
                                  color={
                                    isView === "all" &&
                                    expandedSupplier.suppId === data.suppId
                                      ? "primary"
                                      : "secondary"
                                  }
                                  label="All"
                                  icon={Edit}
                                  className="font-semibold text-gray-700 text-xs"
                                />
                              </div>
                              <div>
                                <Button
                                  isFocus
                                  isRounded={false}
                                  size="xs"
                                  onClick={() => {
                                    setIsView("store");
                                    setExpandedSupplier({
                                      suppId: data.suppId,
                                      index,
                                    });
                                  }}
                                  color={
                                    isView === "store" &&
                                    expandedSupplier.suppId === data.suppId
                                      ? "primary"
                                      : "secondary"
                                  }
                                  label="Store"
                                  icon={Edit}
                                  className="font-semibold text-gray-700 text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons - 4 columns */}
                          <div className="col-span-4 flex justify-center">
                            <div className="flex items-center gap-2">
                              <div className="bg-white border-gray-200 border-0 flex items-center gap-1">
                                <Button
                                  isRounded={false}
                                  size="xs"
                                  onClick={() => {
                                    throw new Error(
                                      "Function not implemented.",
                                    );
                                  }}
                                  color="secondary"
                                  label="Edit"
                                  icon={Edit}
                                  className="font-semibold text-gray-700 text-xs"
                                />
                                <Button
                                  isRounded={false}
                                  size="xs"
                                  onClick={() => {
                                    setSelectedSupplier(data);
                                    setShowROPDF("supplier");
                                  }}
                                  color="secondary"
                                  label="PDF"
                                  icon={FileText}
                                  className="font-semibold text-gray-700 text-xs"
                                />
                                {data.items.some(
                                  (i) =>
                                    i.poItemStatus === "sent" ||
                                    i.poItemStatus === "received",
                                ) ? (
                                  <>
                                    <Button
                                      isRounded={false}
                                      disabled={true}
                                      size="xs"
                                      onClick={() => {
                                        throw new Error(
                                          "Function not implemented.",
                                        );
                                      }}
                                      color="success"
                                      label="Sent"
                                      icon={Check}
                                      className="font-semibold"
                                    />
                                    {data.items
                                      .filter(
                                        (i) => i.poItemStatus !== "not_ordered",
                                      )
                                      .every(
                                        (i) => i.poItemStatus === "received",
                                      ) ? (
                                      <Button
                                        isRounded={false}
                                        size="xs"
                                        onClick={() => {
                                          setReceivedSupplierItem(data);
                                        }}
                                        color="success"
                                        label="Received"
                                        icon={PackageCheck}
                                        className="font-semibold"
                                      />
                                    ) : (
                                      <Button
                                        isRounded={false}
                                        size="xs"
                                        onClick={() => {
                                          setReceivedSupplierItem(data);
                                        }}
                                        color="primary"
                                        label="Receive"
                                        icon={PackageOpen}
                                        className="font-semibold"
                                      />
                                    )}
                                  </>
                                ) : (
                                  <Button
                                    loading={sendingSupplier === index}
                                    isRounded={false}
                                    size="xs"
                                    onClick={() =>
                                      handleSendBySupplier(
                                        data.items,
                                        data.suppId,
                                        index,
                                      )
                                    }
                                    color="secondary"
                                    label="Send"
                                    icon={Send}
                                    disabled={
                                      sendingSupplier !== index &&
                                      sendingSupplier !== null
                                    }
                                    className="font-semibold"
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Stats & Toggle - 2 columns */}
                          <div className="col-span-2 flex justify-end items-center gap-4">
                            <div className="flex flex-col items-center">
                              <span className="text-xs">
                                {data.items?.length} item(s)
                              </span>
                              <p className="font-bold text-primary-1 text-sm">
                                {formatPeso(
                                  data.items
                                    .filter(
                                      (i) => i.poItemStatus !== "not_ordered",
                                    )
                                    .reduce((total, item) => {
                                      const price = Number(item.unitPrice) || 0;
                                      const quantity =
                                        item.poItemStatus === "received"
                                          ? item.poItemReceivedQty
                                          : item.poItemOrderedQty;
                                      const qty = Number(quantity) || 0;
                                      return total + price * qty;
                                    }, 0),
                                )}
                              </p>
                            </div>
                            <div
                              onClick={() =>
                                setExpandedSupplier({
                                  suppId:
                                    expandedSupplier.suppId === data.suppId
                                      ? 0
                                      : data.suppId,
                                  index:
                                    expandedSupplier.index === index
                                      ? null
                                      : index,
                                })
                              }
                              className="cursor-pointer"
                            >
                              {expandedSupplier.suppId === data.suppId ? (
                                <ChevronUp size={20} />
                              ) : (
                                <ChevronDown size={20} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content with Proper Scrolling */}
                      {expandedSupplier.suppId === data.suppId && (
                        <div className="flex-1 min-h-0 overflow-hidden">
                          {isView === "all" ? (
                            <div className="min-h-50 overflow-auto">
                              {" "}
                              {/* Fixed height for table */}
                              <Table
                                uniqueIdKey="poItemId"
                                textSize="xs"
                                columns={columns}
                                data={data.items}
                                isRounded={false}
                                localSearch={true}
                                renderTopActions
                              />
                            </div>
                          ) : (
                            <div className="min-h-50 overflow-auto p-2">
                              {" "}
                              {/* Fixed height for cards */}
                              <div className="flex gap-4">
                                {itemResponse.data.map((data) => (
                                  <StoreCardInSupplier
                                    data={data}
                                    key={data.storeId}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="border border-gray-300 rounded-lg overflow-hidden flex flex-col"
                      key={index}
                    >
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 cursor-pointer hover:from-gray-100 hover:to-gray-150 transition flex-shrink-0">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Package className="text-primary-1" size={24} />
                            <h1 className="font-semibold text-sm">
                              No Supplier Items
                            </h1>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="bg-white border-gray-200 border-0 flex">
                                <div>
                                  <Button
                                    isRounded={false}
                                    size="xs"
                                    onClick={function (): void {
                                      throw new Error(
                                        "Function not implemented.",
                                      );
                                    }}
                                    color="secondary"
                                    label="Edit"
                                    icon={Edit}
                                    className="font-semibold text-gray-700 text-xs"
                                  />
                                </div>

                                <div>
                                  <Button
                                    isRounded={false}
                                    size="xs"
                                    onClick={function (): void {
                                      setSelectedSupplier(data);
                                      setShowROPDF("supplier");
                                    }}
                                    color="secondary"
                                    label="PDF"
                                    icon={FileText}
                                    className="font-semibold text-gray-700 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xs">
                                {data.items?.length} item(s)
                              </span>
                              <p className="font-bold text-primary-1 text-sm">
                                {formatPeso(
                                  data.items.reduce((total, item) => {
                                    const price = Number(item.unitPrice) || 0;
                                    const qty =
                                      Number(item.poItemOrderedQty) || 0;
                                    return total + price * qty;
                                  }, 0),
                                )}
                              </p>
                            </div>
                            <div
                              onClick={() =>
                                setExpandedSupplier({
                                  suppId:
                                    expandedSupplier.suppId === data.suppId
                                      ? 0
                                      : data.suppId,
                                  index:
                                    expandedSupplier.index === index
                                      ? null
                                      : index,
                                })
                              }
                            >
                              {expandedSupplier.index === index ? (
                                <ChevronUp size={20} />
                              ) : (
                                <ChevronDown size={20} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content with Proper Scrolling */}
                      {expandedSupplier.index === index && (
                        <div className="min-h-0 overflow-hidden">
                          {isView === "all" ? (
                            <div className="h-96 overflow-auto">
                              <Table
                                uniqueIdKey="poItemId"
                                textSize="xs"
                                columns={columns}
                                data={data.items}
                                isRounded={false}
                              />
                            </div>
                          ) : (
                            <div className="h-96 overflow-auto p-2">
                              <div className="flex gap-4">
                                {itemResponse.data.map((data) => (
                                  <StoreCardInSupplier
                                    data={data}
                                    key={data.storeId}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="border-t border-gray-300 flex justify-between pl-4 pr-4 pt-4 pb-4 gap-4 items-center flex-shrink-0">
          <span className="flex items-center">
            <Clock size={15} />
            <span className="text-xs ml-2"> Created: {}</span>
          </span>
          <div className="flex gap-3">
            <div>
              <Button
                size="sm"
                label="Supplier PDF"
                onClick={() => {
                  console.log("Test");
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
                    handleUpdatePOStatus();
                  }}
                />
              </div>
            )}
            {/* {data.some((supp) => supp.suppId) && (
              <div>
                <Button
                  size="sm"
                  onClick={function (): void {
                    handleSendToSupliers(data);
                  }}
                  label="Send to Suppliers"
                  icon={Send}
                  className="font-semibold text-xs px-2 py-2"
                />
              </div>
            )} */}
          </div>
        </div>
      </div>

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
              <PurchaseOrderPDF data={poData} />
            )}
          </PDFViewer>
        ) : (
          <div className="flex items-center justify-center h-full">
            Generating PDF...
          </div>
        )}
      </Modal>
      {receivedSupplierItem && (
        <Modal
          className="h-[95%]"
          isOpen={receivedSupplierItem !== null}
          size="xl"
          onClose={function (): void {
            setReceivedSupplierItem(null);
          }}
          title={`Received from ${receivedSupplierItem.suppName}`}
        >
          <ReceivedComponent
            onMaskAsDeliverdSupplier={handleNotOrderedSupplierItem}
            onReceivePO={handleReceivePO}
            supplier={receivedSupplierItem}
            mutateInventory={mutate}
            originalData={receivedSupplierItem}
            expandedSupplier={null}
            setExpandedSupplier={function (
              value: React.SetStateAction<number | null>,
            ): void {
              console.log({ value });
            }}
          />
          {/* <PDFViewer width="100%" height="100%">
            {showROPDF === "supplier" ? (
              <POSupplierItemsPDF data={selectedSupplier!} poData={poData} />
            ) : (
              <PDFViewer width="100%" height="100%">
                <PurchaseOrderPDF data={poData} />
              </PDFViewer>
            )}
          </PDFViewer> */}
        </Modal>
      )}
    </div>
  );
};

export default ApprovedPOView;
