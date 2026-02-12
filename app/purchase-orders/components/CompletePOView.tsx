import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayRequisitionWithItems,
  RequestItemsCombine,
} from "@/dtos/purchase.dto";
import { PurchaseOrders } from "@/types/purchaseOrders";

import { Request, RequestItems } from "@/types/request";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { getRequestStatusOption } from "@/utils/requestOrderUtils";

import {
  Edit,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  PackageCheckIcon,
  Check,
  Truck,
  Package,
  Printer,
  Download,
  Plus,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AddItemToRequestModal from "./_components/AddItemToRequestModal";
import Popup from "@/components/shared/PopupModal";
import AddItemToRequestFromPOModal, {
  POAddToRequestItemForm,
} from "./_components/AddItemToRequestFromPOModal";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import DynamicDropdown from "@/components/shared/DynamicDropdown";
interface StatusOption {
  label: string;
  value: string;
  bg: string;
  color: string;
}

export const statusOptions: StatusOption[] = [
  {
    label: "Not Ordered",
    value: "not_ordered",
    bg: "bg-red-100",
    color: "text-red-600",
  },
  {
    label: "Pending",
    value: "pending",
    bg: "bg-gray-100",
    color: "text-gray-700",
  },
  {
    label: "Delivered",
    value: "delivered",
    bg: "bg-yellow-100",
    color: "text-yellow-700",
  },

  {
    label: "Received",
    value: "received",
    bg: "bg-emerald-100",
    color: "text-emerald-700",
  },
  {
    label: "Partial",
    value: "partial",
    bg: "bg-blue-100",
    color: "text-blue-700",
  },
];
export function getStatusOption(value: string): StatusOption {
  const option = statusOptions.find((opt) => opt.value === value);
  return (
    option ?? {
      label: "Unknown",
      value,
      bg: "bg-gray-100",
      color: "text-gray-700",
    }
  );
}
interface CompletePOViewProps {
  data: DisplayRequisitionWithItems[];
  poData: PurchaseOrders | null;
  isLoading?: boolean;
  onFulfillRequest?: (
    requestId: string,
    items: RequestItemsCombine[],
  ) => Promise<boolean>;
  onMarkDelivered: (request: Request[]) => Promise<boolean>;
  onCompleteRequest: (po: PurchaseOrders) => Promise<boolean>;
  onClose: () => void;
  mutate: () => void;
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request" | "supplier">
  >;
}

const CompletePOView: React.FC<CompletePOViewProps> = ({
  data,
  onMarkDelivered,
  poData,
  onCompleteRequest,
  onClose,
  mutate,
  setShowAllItems,
}) => {
  const [isRequestExpanded, setIsRequestExpanded] = useState<string | null>(
    null,
  );
  const [isShowDeliverConfirm, setIsShowDeliverConfirm] = useState(false);
  const [deliverRequestData, setDeliverRequestData] =
    useState<DisplayRequisitionWithItems | null>(null);
  const [requestItems, setRequestItems] =
    useState<DisplayRequisitionWithItems[]>(data);
  const [selectedStatus, setSelectedStatus] = useState<
    Record<string, string | null>
  >({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isShowAddItemRequest, setIsShowAddItemRequest] =
    useState<boolean>(false);
  const [isShowAddItemFromPO, setIsShowAddItemFromPO] =
    useState<boolean>(false);
  const [selectedRequestNo, setSelectedRequestNo] =
    useState<DisplayRequisitionWithItems | null>(null);
  const [originalData, setOriginalData] = useState<
    DisplayRequisitionWithItems[] | null
  >(null);
  const validForCompletePO = data.every((i) => i.requestStatus === "completed");
  const columns: Column<RequestItemsCombine>[] = [
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
      key: "itemPrice",
      selector: (row) => formatPeso(row.itemPrice),
    },
    {
      name: "Unit",
      key: "itemUnit",
    },
    {
      name: "Request Qty",
      key: "reqItemQuantity",
    },
    {
      name: "Stock Room Qty",
      key: "stockRoomQty",
    },
    {
      name: "Fulfill Qty",
      key: "reqItemTransfer",
      editable: (row) => {
        return (
          !["delivered", "completed", "received", "not_ordered"].includes(
            row.reqItemStatus ?? "",
          ) && row.reqItemStatus !== "not_ordered"
        );
      },
      inputType: "number",
      selector: (row) => {
        if (row.reqItemStatus === "not_ordered") return 0;

        const qty = Number(row.reqItemTransfer ?? 0);
        return qty === 0 ? "" : qty;
      },

      value: (row) => {
        if (row.reqItemStatus === "not_ordered") return 0;

        const qty = Number(row.reqItemTransfer ?? 0);
        return qty === 0 ? "" : qty;
      },
    },

    {
      name: "Received Qty",
      key: "reqItemReceived",
    },
    {
      name: "Total",
      key: "total",

      selector: (row) =>
        row.reqItemStatus === "not_ordered"
          ? 0
          : formatPeso(
              Number(
                row.reqItemStatus === "delivered"
                  ? row.reqItemTransfer
                  : row.reqItemStatus === "received" ||
                      row.reqItemStatus === "completed"
                    ? row.reqItemReceived
                    : row.reqItemQuantity,
              ) * row.itemPrice,
            ),
    },
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
      editable: (row) => {
        const origStatus: RequestItemsCombine = findOriginalDataRequestItem(
          row.requestId,
          row.reqItemId,
        );
        return (
          ["pending", "partial", "not_ordered"].includes(
            row.reqItemStatus ?? "",
          ) && origStatus.reqItemStatus !== "not_ordered"
        );
      },
      inputType: "select",
      selectOptionVariant: "custom", // ✅ matches interface
      options: [
        {
          label: "Not Ordered",
          value: "not_ordered",
          bg: "bg-red-100",
          color: "text-red-600",
        },
        // {
        //   label: "Delivered",
        //   value: "delivered",
        //   bg: "bg-yellow-100",
        //   color: "text-yellow-700",
        // },
        {
          label: "Partial",
          value: "partial",
          bg: "bg-blue-100",
          color: "text-blue-700",
        },
        {
          label: "Pending",
          value: "pending",
          bg: "bg-gray-100",
          color: "text-gray-700",
        },
      ],
      value: (row) => row.reqItemStatus,
    },
    {
      name: "Remarks",
      key: "reqItemRemarks",
      editable: (row) => {
        const status = data.find(
          (req) => req.requestId === row.requestId,
        )?.requestStatus;

        const origStatus: RequestItemsCombine = findOriginalDataRequestItem(
          row.requestId,
          row.reqItemId,
        );

        const isFinalRequestStatus = [
          "delivered",
          "completed",
          "received",
        ].includes(status ?? "");

        return (
          !isFinalRequestStatus &&
          row.reqItemStatus === "not_ordered" &&
          origStatus.reqItemStatus !== "not_ordered"
        );
      },
    },
  ];
  const hasPartialColumns: Column<RequestItemsCombine>[] = [
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
      key: "itemPrice",
      selector: (row) => formatPeso(row.itemPrice),
    },
    {
      name: "Unit",
      key: "itemUnit",
    },
    {
      name: "Request Qty",
      key: "reqItemQuantity",
      selector: (row) => (row.reqItemQuantity === 0 ? "" : row.reqItemQuantity),
    },
    {
      name: "Stock Room Qty",
      key: "stockRoomQty",
    },
    {
      name: "Fulfill Qty",
      key: "reqItemTransfer",
      editable: (row) => {
        return (
          ![
            "delivered",
            "completed",
            "received",
            "not_ordered",
            "partial",
          ].includes(row.reqItemStatus ?? "") &&
          row.reqItemStatus !== "not_ordered"
        );
      },
      inputType: "number",
      selector: (row) =>
        row.reqItemStatus === "not_ordered"
          ? 0
          : row.reqItemTransfer === 0
            ? ""
            : row.reqItemTransfer,
      value: (row) =>
        row.reqItemStatus === "not_ordered" ? 0 : row.reqItemTransfer,
    },

    {
      name: "To Follow",
      key: "reqItemToFollow",
      editable: (row) => {
        const originalItems = findOriginalDataRequestItem(
          row.requestId,
          row.reqItemId,
        );

        return originalItems.reqItemStatus === "partial";
      },
      inputType: "number",
      selector: (row) => (row.reqItemToFollow === 0 ? "" : row.reqItemToFollow),
    },

    {
      name: "Received Qty",
      key: "reqItemReceived",
      selector: (row) => (row.reqItemReceived === 0 ? "" : row.reqItemReceived),
    },
    {
      name: "Total",
      key: "total",

      selector: (row) =>
        row.reqItemStatus === "not_ordered"
          ? 0
          : formatPeso(
              Number(
                row.reqItemStatus === "delivered"
                  ? row.reqItemTransfer
                  : row.reqItemStatus === "received" ||
                      row.reqItemStatus === "completed"
                    ? row.reqItemReceived
                    : row.reqItemQuantity,
              ) * row.itemPrice,
            ),
    },
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
      editable: (row) => {
        const origStatus: RequestItemsCombine = findOriginalDataRequestItem(
          row.requestId,
          row.reqItemId,
        );
        return (
          ["pending", "partial", "not_ordered"].includes(
            row.reqItemStatus ?? "",
          ) && origStatus.reqItemStatus !== "not_ordered"
        );
      },
      inputType: "select",
      selectOptionVariant: "custom", // ✅ matches interface
      options: [
        {
          label: "Not Ordered",
          value: "not_ordered",
          bg: "bg-red-100",
          color: "text-red-600",
        },
        // {
        //   label: "Delivered",
        //   value: "delivered",
        //   bg: "bg-yellow-100",
        //   color: "text-yellow-700",
        // },
        {
          label: "Partial",
          value: "partial",
          bg: "bg-blue-100",
          color: "text-blue-700",
        },
        {
          label: "Pending",
          value: "pending",
          bg: "bg-gray-100",
          color: "text-gray-700",
        },
      ],
      value: (row) => row.reqItemStatus,
    },
    {
      name: "Remarks",
      key: "reqItemRemarks",
      editable: (row) => {
        const status = data.find(
          (req) => req.requestId === row.requestId,
        )?.requestStatus;

        const origStatus: RequestItemsCombine = findOriginalDataRequestItem(
          row.requestId,
          row.reqItemId,
        );

        const isFinalRequestStatus = [
          "delivered",
          "completed",
          "received",
        ].includes(status ?? "");

        return (
          !isFinalRequestStatus &&
          row.reqItemStatus === "not_ordered" &&
          origStatus.reqItemStatus !== "not_ordered"
        );
      },
    },
  ];
  const handleDataChange = (
    requestNo: string,
    updatedItems: RequestItemsCombine[],
  ) => {
    setRequestItems((prev) =>
      prev.map((items) =>
        items.requestNo === requestNo
          ? { ...items, requestItemsData: updatedItems }
          : items,
      ),
    );
    const transfersAndStatus = updatedItems.reduce(
      (acc, item) => {
        acc[item.reqItemId] = {
          reqItemTransfer: Number(item.reqItemTransfer),
          reqItemStatus: item.reqItemStatus,
        };
        return acc;
      },
      {} as Record<string, { reqItemTransfer?: number; reqItemStatus: string }>,
    );
    localStorage.setItem(
      `reqItemTransfer_${requestNo}`,
      JSON.stringify(transfersAndStatus),
    );
  };

  useEffect(() => {
    if (data && data.length > 0) {
      const hydratedData = data.map((req) => {
        const savedRaw = localStorage.getItem(
          `reqItemTransfer_${req.requestNo}`,
        );
        let saved:
          | Record<string, { reqItemTransfer?: number; reqItemStatus?: string }>
          | undefined;

        try {
          if (savedRaw) {
            saved = JSON.parse(savedRaw);
          }
        } catch (e) {
          console.warn(`Failed to parse localStorage for ${req.requestNo}`, e);
        }

        if (saved) {
          const newItems: RequestItemsCombine[] = req.requestItemsData.map(
            (item) => ({
              ...item,
              // Force type to RequestItemStatus
              reqItemTransfer:
                saved![item.reqItemId]?.reqItemTransfer ?? item.reqItemTransfer,
              reqItemStatus:
                (saved![item.reqItemId]
                  ?.reqItemStatus as RequestItemsCombine["reqItemStatus"]) ??
                item.reqItemStatus,
            }),
          );
          return { ...req, requestItemsData: newItems };
        }

        return req;
      });
      setOriginalData(data);
      setRequestItems(hydratedData);
    }
  }, [data]);
  const findOriginalDataRequestItem = (
    requestId: number,
    reqItemId: number,
  ) => {
    const find = originalData
      ?.find((req) => req.requestId === requestId)
      ?.requestItemsData.find((item) => item.reqItemId === reqItemId);
    return find as RequestItemsCombine;
  };
  const handleAutoFillAll = (requestNo: string) => {
    let insufficientCount = 0;

    // Find current items
    const currentItems = requestItems.find(
      (items) => items.requestNo === requestNo,
    );
    if (!currentItems) return;

    // Compute updated items
    const updatedItems = currentItems.requestItemsData.map((item) => {
      if (item.reqItemStatus === "not_ordered") return item;

      if (item.reqItemQuantity > (item.stockRoomQty || 0)) {
        insufficientCount++;
        return { ...item };
      }

      return { ...item, reqItemTransfer: Number(item.reqItemQuantity) };
    });

    // Save to localStorage immediately
    const transfers = updatedItems.reduce(
      (acc, item) => {
        acc[item.reqItemId] = {
          reqItemTransfer: item.reqItemTransfer,
          reqItemStatus: item.reqItemStatus,
        };
        return acc;
      },
      {} as Record<string, { reqItemTransfer?: number; reqItemStatus: string }>,
    );

    localStorage.setItem(
      `reqItemTransfer_${requestNo}`,
      JSON.stringify(transfers),
    );

    // Update state
    setRequestItems((prev) =>
      prev.map((items) =>
        items.requestNo === requestNo
          ? { ...items, requestItemsData: updatedItems }
          : items,
      ),
    );

    if (insufficientCount > 0) {
      toast.error(
        `${insufficientCount} items are not fulfilled due to out of stock!`,
      );
    }
  };

  const handleMarkPaid = async (data: DisplayRequisitionWithItems) => {
    const newRequestItems: RequestItems[] = data.requestItemsData.map(
      (items) => ({
        ...items,
      }),
    );

    const hasNoFulFillQty = newRequestItems.some(
      (item) =>
        item.reqItemStatus !== "not_ordered" &&
        Number(item.reqItemTransfer) === 0,
    );
    console.log({ hasNoFulFillQty });
    if (hasNoFulFillQty) {
      toast.error("Failed to deliver. Cannot deliver 0 quantity");
      return;
    }
    setIsProcessing(data.requestNo);
    try {
      const newRequest: Request[] = [
        {
          ...data,
          requestItems: newRequestItems,
        },
      ];
      console.log({ newRequest });
      if (onMarkDelivered) {
        const success = await onMarkDelivered(newRequest);
        if (success) {
          localStorage.removeItem(`reqItemTransfer_${data.requestNo}`);
          mutate();
          setIsShowDeliverConfirm(false);
          setDeliverRequestData(null);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCompletePO = async () => {
    if (!poData) {
      return;
    }
    const success = await onCompleteRequest(poData);
    if (success) {
      onClose();
    }
  };

  const handleAddItemPOToRequest = async (data: POAddToRequestItemForm) => {
    try {
      const res = await fetch(
        `/api/purchase-order/po-request-order/requestId/${data.poId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );
      const result = await res.json();
      if (!res.ok) {
        throw new Error("Failed to add items to request");
      }
      toast.success(result.message || "Items added to request successfully");
      return true;
    } catch (e) {
      toast.error((e as Error).message || "Failed to add items to request");
      return false;
    }
  };
  const totalPOAmount = requestItems.reduce((sum, req) => {
    const totalAmountItems = (req.requestItemsData ?? [])
      .filter((item) => item.reqItemStatus === "received")
      .reduce((sumItem, item) => {
        return sumItem + Number(item.reqItemReceived) * Number(item.itemPrice);
      }, 0);
    return sum + totalAmountItems;
  }, 0);
  return (
    <div className="gap-5  h-full flex flex-col overflow-hidden">
      <div className="flex p-2 gap-2  flex-col h-full w-full overflow-y-auto">
        <div className="p-4 border-b-1 bg-white rounded border-gray-200 ">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h1 className="text-xs xl:text-md font-semibold">
                Requisition Fulfillment
              </h1>
              <p className="text-[9px] xl:text-xs text-gray-500 mt-1">
                Review and fulfill requisition requests
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="self-center">
                  <Button
                    size="sm"
                    label="Supplier View"
                    onClick={() => {
                      setShowAllItems("supplier");
                    }}
                    color="outline"
                  />
                </div>
                <div className="self-center">
                  <Button
                    size="sm"
                    label="All PO View"
                    onClick={() => {
                      setShowAllItems("all");
                    }}
                    color="outline"
                  />
                </div>
                <div className="self-center">
                  <Button
                    size="sm"
                    label="PO Request View"
                    onClick={() => {
                      setShowAllItems("request");
                    }}
                    color="outline"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <span className="text-sm">
                  Total Purchase:{" "}
                  <span className="font-semibold text-lg">
                    {formatPeso(totalPOAmount)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto">
          {requestItems?.map((reqData) => {
            const { label, bg, color, border } = getRequestStatusOption(
              reqData.requestStatus ?? "",
            );

            const totalRequestItemPrice = reqData.requestItemsData
              .filter((item) => item.reqItemStatus !== "not_ordered")
              .reduce((total, item) => {
                const quantity = Number(
                  item.reqItemStatus === "delivered"
                    ? item.reqItemTransfer
                    : item.reqItemStatus === "received" ||
                        item.reqItemStatus === "completed"
                      ? item.reqItemReceived
                      : item.reqItemQuantity,
                );
                const price = Number(item.itemPrice || 0);
                return total + quantity * price;
              }, 0);
            const statusOption = Array.from(
              new Map(
                reqData.requestItemsData.map((i) => {
                  const { value, label } = getRequestStatusOption(
                    i.reqItemStatus,
                  );

                  const count = reqData.requestItemsData.filter(
                    (item) => item.reqItemStatus === i.reqItemStatus,
                  ).length;

                  return [value, { label: `${label} (${count})`, value }];
                }),
              ).values(),
            );
            const origRequest = originalData?.find(
              (req) => req.requestId === reqData.requestId,
            )?.requestItemsData;
            const hasPartial = origRequest?.some(
              (item) => item.reqItemStatus === "partial",
            );
            const hasToFollowQty = origRequest?.some(
              (i) => Number(i.reqItemToFollow) !== 0,
            );
            return (
              <div
                className="flex flex-col rounded-lg shadow w-full border-1 border-gray-200 cursor-pointer"
                key={reqData.requestId}
                onClick={() =>
                  setIsRequestExpanded(
                    isRequestExpanded === reqData.requestNo
                      ? null
                      : reqData.requestNo,
                  )
                }
              >
                <div className="flex items-center justify-between p-2 bg-white rounded-t-lg rounded-r-lg">
                  <div className="flex flex-col border-gray-200">
                    <div className="flex items-center gap-2">
                      {" "}
                      <h1 className="text-xs xl:text-sm font-semibold">
                        {reqData.requestNo}
                      </h1>
                      <div className="flex items-center gap-2">
                        {" "}
                        <span
                          className={`flex items-center  gap-1 px-2 py-1 rounded-full text-[9px] xl:text-xs font-medium ${bg}  rounded-2xl ${color} ${border}`}
                        >
                          <Clock className="w-2.5 h-2.5" /> {label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-[9px] xl:text-xs gap-4  text-gray-600">
                      <span className="flex items-center gap-1">
                        <Package size={14} />
                        {reqData.storeName}
                      </span>
                      <span>{reqData.requestItemsData.length} items</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDateToWords(reqData.poCreatedAt)}
                      </span>
                    </div>
                  </div>
                  <div
                    onClick={() =>
                      setIsRequestExpanded(
                        isRequestExpanded === reqData.requestNo
                          ? null
                          : reqData.requestNo,
                      )
                    }
                    className="cursor-pointer"
                  >
                    <div className="flex gap-2 items-center">
                      <div className="flex flex-col gap-1 mr-5">
                        <span className="text-xs text-gray-500">
                          Total Amount
                        </span>

                        <span className="font-semibold">
                          {formatPeso(totalRequestItemPrice)}
                        </span>
                      </div>
                      {isRequestExpanded === reqData.requestNo ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {isRequestExpanded === reqData.requestNo && (
                  <>
                    <div className="flex p-2 border-t border-gray-200 bg-white justify-between">
                      {/* Left side: Fulfill button */}
                      <div>
                        {!["delivered", "received", "completed"].includes(
                          reqData.requestStatus ?? "",
                        ) && (
                          <Button
                            size="xs"
                            onClick={() => handleAutoFillAll(reqData.requestNo)}
                            label={
                              isProcessing === reqData.requestNo
                                ? "Processing..."
                                : `Fulfill ${reqData.requestNo}`
                            }
                            icon={CheckCircle}
                            disabled={isProcessing === reqData.requestNo}
                            color="success"
                          />
                        )}
                      </div>

                      {/* Right side: Print & Download always at the end */}
                      <div className="flex gap-2">
                        <button className="p-1.5 hover:bg-gray-200 rounded transition-colors">
                          <Printer size={16} className="text-gray-600" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-200 rounded transition-colors">
                          <Download size={16} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-visible">
                      <Table
                        addContentLeftTitle={
                          <div>
                            <DynamicDropdown
                              options={statusOption}
                              onChange={(value) => {
                                setSelectedStatus((prev) => ({
                                  ...prev,
                                  [reqData.requestNo]:
                                    value === "all" ? null : String(value),
                                }));
                              }}
                              placeholder={"Status"}
                              size="sm"
                              icon={<Clock className="w-3 h-3" />}
                            />
                          </div>
                        }
                        localSearch
                        uniqueIdKey="reqItemId"
                        columns={
                          hasPartial
                            ? hasPartialColumns
                            : hasToFollowQty
                              ? hasPartialColumns
                              : columns
                        }
                        showActions={
                          !["delivered", "completed", "received"].includes(
                            reqData.requestStatus ?? "",
                          )
                        }
                        renderActions={(row) => {
                          const origStatus: RequestItemsCombine =
                            findOriginalDataRequestItem(
                              row.requestId,
                              row.reqItemId,
                            );
                          const isFinalRequestStatus = [
                            "delivered",
                            "completed",
                            "received",
                          ].includes(row.reqItemStatus ?? "");
                          return (
                            !isFinalRequestStatus &&
                            row.reqItemStatus === "pending" &&
                            origStatus.reqItemStatus !== "not_ordered" && (
                              <div>
                                <IconButton
                                  onClick={function (): void {
                                    // setIsProcessing(reqData.requestNo);
                                  }}
                                  label={`Fulfill ${row.itemName}`}
                                  icon={<Check size={18} />}
                                  bg={""}
                                />
                              </div>
                            )
                          );
                        }}
                        data={[...reqData.requestItemsData].sort((a, b) => {
                          const selected = selectedStatus[reqData.requestNo];
                          if (!selected) return 0; // no reordering if nothing selected

                          if (
                            a.reqItemStatus === selected &&
                            b.reqItemStatus !== selected
                          )
                            return -1; // a first
                          if (
                            a.reqItemStatus !== selected &&
                            b.reqItemStatus === selected
                          )
                            return 1; // b first
                          return 0; // keep relative order otherwise
                        })}
                        isRounded={false}
                        updateData={(updatedItems) =>
                          handleDataChange(reqData.requestNo, updatedItems)
                        }
                      />
                    </div>
                  </>
                )}
                <div className="flex border-t-1 p-2 bg-white rounded-b-lg justify-between border-gray-200 items-center">
                  {Boolean(
                    !["completed", "delivered", "received"].includes(
                      reqData.requestStatus ?? "",
                    ) || hasPartial,
                  ) && (
                    <>
                      {/* <div>
                          <Button
                            color="tertiary"
                            size="xs"
                            onClick={() => {
                              setIsShowAddItemRequest(true);
                              setSelectedRequestNo(reqData);
                            }}
                            label="Add Item in Request"
                            icon={Package}
                          />
                        </div> */}
                      <div>
                        <Button
                          color="outline"
                          size="xs"
                          onClick={() => {
                            setIsShowAddItemFromPO(true);
                            setSelectedRequestNo(reqData);
                          }}
                          label="Add Item from PO"
                          icon={Plus}
                        />
                      </div>

                      <div>
                        <Button
                          size="xs"
                          onClick={() => {
                            const hasNoFulFillQty = reqData.requestItemsData
                              .filter((i) => i.reqItemStatus !== "delivered")
                              .some(
                                (item) =>
                                  item.reqItemStatus !== "not_ordered" &&
                                  Number(item.reqItemTransfer) === 0,
                              );
                            const hasNoToFollowQty = reqData.requestItemsData
                              .filter((i) => i.reqItemStatus !== "delivered")
                              .some(
                                (item) =>
                                  item.reqItemStatus !== "not_ordered" &&
                                  item.reqItemStatus === "partial" &&
                                  Number(item.reqItemToFollow) === 0,
                              );
                            console.log({ hasNoToFollowQty, hasPartial });
                            if (hasNoToFollowQty && hasPartial) {
                              toast.error(
                                "Failed to deliver. Cannot deliver 0 to follow quantity",
                              );
                              return;
                            }
                            if (hasNoFulFillQty) {
                              toast.error(
                                "Failed to deliver. Cannot deliver 0 quantity",
                              );
                              return;
                            }
                            setIsShowDeliverConfirm(true);
                            setDeliverRequestData(reqData);
                            console.log({ reqData });
                          }}
                          label={
                            isProcessing === reqData.requestNo
                              ? "Processing..."
                              : `Mark as Delivered`
                          }
                          icon={Truck}
                          disabled={isProcessing === reqData.requestNo}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t  border-gray-300  flex justify-between 2xl:pl-4 2xl:pr-4 2xl:pt-4 2xl:pb-4 gap-4 items-center">
        <span className="flex items-center">
          <Clock size={15} />{" "}
          <span className="text-[9px] md:text-xs ml-2">
            {" "}
            Created: {formatDateToWords(poData?.poCreatedAt ?? "")}
          </span>
        </span>
        <div className="flex gap-3">
          <div className="">
            <Button
              color="secondary"
              size="sm"
              onClick={function (): void {
                throw new Error("Function not implemented.");
              }}
              label="PDF"
              icon={Edit}
              className="font-semibold text-gray-700 text-xs px-2 py-2"
            />
          </div>
          {validForCompletePO && poData?.poStatus !== "completed" && (
            <div>
              <Button
                size="sm"
                onClick={function (): void {
                  handleCompletePO();
                }}
                label="Complete PO"
                disabled={!validForCompletePO}
                icon={PackageCheckIcon}
                className="font-semibold  text-xs px-2 py-2"
              />
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={isShowAddItemFromPO}
        onClose={function (): void {
          setIsShowAddItemFromPO(false);
        }}
        title="Add Item in Request from PO"
        subtitle={`${selectedRequestNo?.requestNo}`}
        size="xl"
        className="h-[80%]"
      >
        <AddItemToRequestFromPOModal
          reqData={selectedRequestNo}
          poData={poData}
          onAddItem={handleAddItemPOToRequest}
          mutate={mutate}
          onClose={() => {
            setIsShowAddItemFromPO(false);
          }}
        />
      </Modal>
      <Popup
        background="transaparent"
        title={`Add item to ${selectedRequestNo?.requestNo}`}
        isOpen={isShowAddItemRequest}
        onClose={function (): void {
          setIsShowAddItemRequest(false);
        }}
      >
        <AddItemToRequestModal
          data={selectedRequestNo}
          onCancel={() => {
            setIsShowAddItemRequest(false);
          }}
        />
      </Popup>
      <ConfirmationModal
        onConfirm={() => {
          if (deliverRequestData) {
            const filter = {
              ...deliverRequestData,
              requestItemsData: deliverRequestData.requestItemsData.filter(
                (i) => i.reqItemStatus !== "delivered",
              ),
            };
            console.log({ filter });
            handleMarkPaid(filter);
          }
        }}
        confirmationInfo={`Are you sure you want to deliver items to ${deliverRequestData?.storeName}?`}
        onClose={() => {
          setIsShowDeliverConfirm(false);
          setDeliverRequestData(null);
        }}
        isShow={isShowDeliverConfirm}
        confirmLabel="Confirm"
        isLoading={isProcessing !== null}
      />
    </div>
  );
};

export default CompletePOView;
