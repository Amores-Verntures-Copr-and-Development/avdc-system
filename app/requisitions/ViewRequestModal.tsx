import RequestOrderPDF from "@/components/pdf/RequestOrderPDF";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import Popup from "@/components/shared/PopupModal";
import Table, { Column } from "@/components/shared/Table";
import {
  CreateRequestItemDto,
  DisplayRequestItems,
  DisplayRequestOrderDto,
  RequestOrderPdf,
} from "@/dtos/request.dto";
import { UserAuth } from "@/hooks/useSession";
import { Request, RequestItems } from "@/types/request";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";

import { PDFViewer } from "@react-pdf/renderer";
import {
  CheckLine,
  ChevronLeft,
  Clock,
  FileText,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

import { CreatePurchaseOrderItemDto } from "@/dtos/purchase.dto";
import AddItemROModal from "./components/AddItemROModal";
import AddItemPOModal from "./components/AddItemPOModal";
import PageHeader from "@/components/shared/PageHeader";
import { getStatusOption } from "../purchase-orders/components/CompletePOView";
import { getRequestStatusOption } from "@/utils/requestOrderUtils";
import { Rowdies } from "next/font/google";
import { stringify } from "querystring";

interface ViewRequestModalProps {
  selectedReq: DisplayRequestOrderDto | null;
  mutateRequest: () => void;
  user: UserAuth | null;
  onBack?: () => void;
}
const ViewRequestModal: React.FC<ViewRequestModalProps> = ({
  selectedReq,
  mutateRequest,
  onBack,
  user,
}) => {
  const [isReceiving, setIsReceiving] = useState(false);
  const [isSelectingAddItemPO, setIsSelectingAddItemPO] = useState(false);
  const [showAddPOItem, setShowAddPOItem] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingItemPo, setIsAddingItemPo] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  const [isEditting, setIsEditting] = useState(false);
  const [requestItemData, setRequestItemData] = useState<DisplayRequestItems[]>(
    [],
  );
  const [originalData, setOriginalData] = useState<DisplayRequestItems[]>([]);
  const [showReceivedConfirmation, setShowReceivedConfirmation] =
    useState(false);
  const [showROPDF, setShowROPDF] = useState(false);
  const [pdfData, setPdfData] = useState<RequestOrderPdf | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedRows, setSelectedRows] = useState<
    DisplayRequestItems[] | null
  >(null);
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: DisplayRequestItems[] }>(
    selectedReq
      ? `/api/requests/request-items/${selectedReq?.requestId}`
      : null,
    fetcher,
  );
  useEffect(() => {
    if (!itemResponse.data || itemResponse.data.length === 0) return;

    const saved: DisplayRequestItems[] | null = JSON.parse(
      localStorage.getItem(`${selectedReq?.requestNo}-request-item-draft`) ||
        "null",
    );

    const mergedData = itemResponse.data.map((item) => {
      const savedItem = saved?.find((s) => s.reqItemId === item.reqItemId);
      return savedItem
        ? { ...item, reqItemReceived: savedItem.reqItemReceived }
        : item;
    });

    setRequestItemData(mergedData);
    setOriginalData(itemResponse.data);
  }, [itemResponse.data, selectedReq?.requestNo]);

  // Save draft on every change
  useEffect(() => {
    if (!requestItemData || requestItemData.length === 0) return;

    localStorage.setItem(
      `${selectedReq?.requestNo}-request-item-draft`,
      JSON.stringify(requestItemData),
    );
  }, [requestItemData, selectedReq?.requestNo]);

  const isRequestor =
    user?.empPosition === "staff" || user?.empPosition === "supervisor";
  const columnPending: Column<DisplayRequestItems>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { name: "Name", key: "itemName" },
    { name: "Unit", key: "itemUnit" },
    {
      name: "Request Qty",
      key: "reqItemQuantity",
      selector: (row) => (
        <span className="font-semibold">
          {formatQuantityByUnit(row.reqItemQuantity, row.itemUnit)}
        </span>
      ),
      editable: showEditMode,
      inputType: "number",
    },
    { name: "Status", key: "reqItemStatus" },
  ];
  const adminColumn: Column<DisplayRequestItems>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { name: "Name", key: "itemName" },
    { name: "Unit", key: "itemUnit" },
    { name: "Request Qty", key: "reqItemQuantity" },
    { name: "Delivered Qty", key: "reqItemTransfer" },
    { name: "Status", key: "reqItemStatus" },
    { name: "Remarks", key: "reqItemRemarks" },
    {
      name: "Received",
      key: "reqItemReceived",
    },
  ];
  const findOriginalData = (reqItemId: number) => {
    const find = originalData.find((i) => i.reqItemId === reqItemId);
    return find;
  };
  const column: Column<DisplayRequestItems>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { name: "Name", key: "itemName" },
    { name: "Unit", key: "itemUnit" },
    {
      name: "Request Qty",
      key: "reqItemQuantity",
      selector: (row) => (
        <span className="font-semibold">
          {formatQuantityByUnit(row.reqItemQuantity, row.itemUnit)}
        </span>
      ),
    },
    {
      name: "Delivered Qty",
      key: "reqItemTransfer",
      selector: (row) =>
        Number(row.reqItemTransfer) === 0 ? "" : row.reqItemTransfer,
    },
    {
      name: "To Follow Qty",
      key: "reqItemToFollow",
      selector: (row) =>
        Number(row.reqItemToFollow) === 0 ? "" : row.reqItemToFollow,
    },
    {
      name: "Received",
      key: "reqItemReceived",
      editable: (row) => {
        const original = findOriginalData(row.reqItemId);
        return (
          // (original?.reqItemStatus === "delivered" ||
          //   original?.reqItemStatus === "partial") &&
          // (Number(row.receivedToFollow) === 0 ||
          //   !Number(row.receivedToFollow)) &&
          // Number(original.reqItemReceived) === 0

          (original?.reqItemStatus === "delivered" ||
            original?.reqItemStatus === "partial") &&
          Number(original.reqItemReceived) === 0
        );
      },
      inputType: "number",
      selector: (row) => {
        return row.reqItemStatus === "not_ordered" ? 0 : row.reqItemReceived;
      },
      value: (row) => {
        return row.reqItemStatus === "not_ordered"
          ? 0
          : Number(row.reqItemReceived) || "";
      },
    },
    { name: "Remarks", key: "reqItemRemarks" },
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
        const original = findOriginalData(row.reqItemId);
        return (
          (row.reqItemStatus === "delivered" ||
            (selectedReq?.requestStatus === "delivered" &&
              original?.reqItemStatus !== "not_ordered")) &&
          original?.reqItemStatus !== "received"
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
      ],

      value: (row) => row.reqItemStatus,
    },
  ];
  const columnToFollow: Column<DisplayRequestItems>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { name: "Name", key: "itemName" },
    { name: "Unit", key: "itemUnit" },
    {
      name: "Request Qty",
      key: "reqItemQuantity",
      selector: (row) => (
        <span className="font-semibold">
          {formatQuantityByUnit(row.reqItemQuantity, row.itemUnit)}
        </span>
      ),
    },
    {
      name: "Delivered Qty",
      key: "reqItemTransfer",
      selector: (row) =>
        Number(row.reqItemTransfer) === 0 ? "" : row.reqItemTransfer,
    },

    {
      name: "Received",
      key: "reqItemReceived",

      inputType: "number",
      selector: (row) => {
        return row.reqItemStatus === "not_ordered" ? 0 : row.reqItemReceived;
      },
      value: (row) => {
        return row.reqItemStatus === "not_ordered"
          ? 0
          : Number(row.reqItemReceived) || "";
      },
    },
    {
      name: "To Follow Qty",
      key: "reqItemToFollow",
      selector: (row) =>
        Number(row.reqItemToFollow) === 0 ? "" : row.reqItemToFollow,
    },
    {
      name: "Received To Follow",
      key: "receivedToFollow",
      inputType: "number",
      editable: (row) =>
        row.reqItemStatus === "delivered" && Number(row.reqItemToFollow) !== 0,
      value: (row) => row.receivedToFollow ?? "",
    },
    { name: "Remarks", key: "reqItemRemarks" },
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
        const original = findOriginalData(row.reqItemId);
        return (
          (row.reqItemStatus === "delivered" ||
            (selectedReq?.requestStatus === "delivered" &&
              original?.reqItemStatus !== "not_ordered")) &&
          original?.reqItemStatus !== "received"
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
      ],

      value: (row) => row.reqItemStatus,
    },
  ];
  const handleReceivedRO = async () => {
    const validReceivedROI: Partial<Request> = {
      ...selectedReq,
      requestItems: requestItemData.filter(
        (i) => i.reqItemStatus === "delivered" || i.reqItemStatus === "partial",
      ),
    };
    console.log({ validReceivedROI });
    const storageKey = `${selectedReq?.requestNo}-request-item-draft`;
    const sendData = {
      controller: "received",
      data: [validReceivedROI],
    };
    setIsReceiving(true);
    try {
      const result = await fetch(`api/requests/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      localStorage.removeItem(storageKey);
      toast.success(res.message);
      mutateRequest();
      mutate();
      setShowReceivedConfirmation(false);
      return true;
    } catch (_e) {
      toast.error("Failed to update Inventory.");
      return false;
    } finally {
      setIsReceiving(false);
    }
  };
  const handleCompleteRO = async () => {
    const requestData: Partial<Request>[] = [
      {
        ...selectedReq,
        requestItems: requestItemData,
      },
    ];
    const sendData = {
      controller: "completed",
      data: requestData,
    };
    try {
      const result = await fetch(`api/requests/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      mutateRequest();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to update Inventory.");
      return false;
    }
  };
  const getOverAllInventoryId = itemResponse.data.every(
    (item) => item.inventoryId,
  )
    ? itemResponse.data[0]?.inventoryId
    : null;
  const getAllInventoryItemIdInRequest = itemResponse.data.map(
    (item) => item.invItem,
  );

  const handleDownloadPDF = () => {
    const pdfData: RequestOrderPdf = {
      requestItems: itemResponse.data,
      store: {
        storeName: selectedReq?.storeName,
      },
      requestOrder: {
        requestId: selectedReq?.requestId,
        requestNo: selectedReq?.requestNo,
        requestCreatedAt: selectedReq?.requestCreatedAt,
        requestStatus: selectedReq?.requestStatus,
      },
      requestedBy: selectedReq?.requestedByName ?? "",
    };
    setPdfData(pdfData);
  };

  const handleAddItemRequest = async (data: CreateRequestItemDto) => {
    setIsAddingItem(true);
    const arrayData = [data];
    try {
      const result = await fetch(
        `api/requests/request-items/${selectedReq?.requestId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(arrayData),
        },
      );
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      mutateRequest();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add item.");
      return false;
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleAddItemPurchaser = async (
    data: CreatePurchaseOrderItemDto[],
    poId: number,
  ) => {
    setIsAddingItemPo(true);

    try {
      const result = await fetch(`api/purchase-order/po-items//${poId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      mutateRequest();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add item.");
      return false;
    } finally {
      setIsAddingItemPo(false);
    }
  };
  const handleRowSelection = (row: DisplayRequestItems[]) => {
    console.log({ row });
    if (row.length > 0) {
      setSelectedRows(row);
    }
    if (row.length === 0) {
      setSelectedRows(null);
    }
  };
  const handleFillUpAll = () => {
    if (requestItemData) {
      setRequestItemData((prev) =>
        prev.map((item) => {
          if (
            item.reqItemStatus === "delivered" &&
            Number(item.reqItemToFollow) === 0
          ) {
            return {
              ...item,
              reqItemReceived: Number(item.reqItemTransfer),
            };
          }
          return {
            ...item, // or any value you want
          };
        }),
      );
    }
  };
  const { label, bg, color } = getRequestStatusOption(
    selectedReq?.requestStatus || "",
  );
  const hasPartialDelivered = requestItemData.some(
    (i) => i.reqItemStatus === "partial",
  );
  const hasToFollowDelivered = requestItemData.some(
    (i) => i.reqItemStatus === "delivered" && Number(i.reqItemToFollow) !== 0,
  );
  const handleSaveEditItem = async () => {
    setIsEditting(true);
    const requestItems: Partial<RequestItems>[] = requestItemData.map(
      (item) => ({
        reqItemId: item.reqItemId,
        reqItemQuantity: Number(item.reqItemQuantity),
      }),
    );
    try {
      console.log({ requestItems });
      const result = await fetch(
        `/api/requests/request-items/${selectedReq?.requestId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestItems),
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success(res.message);
      setShowEditMode(false);
      mutate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsEditting(false);
    }
  };
  return (
    <>
      <div className="flex justify-between">
        {" "}
        <div className="flex flex-col gap-2">
          {" "}
          <PageHeader
            title={`${selectedReq?.requestNo}`}
            subtitle="Request Order"
          />
          <div
            className={`${bg} ${color} py-1 px-2 rounded-md text-sm items-center text-center shadow`}
          >
            {" "}
            <span className="">{label}</span>
          </div>
        </div>
        <div>
          <Button
            label="Back"
            size="xs"
            icon={ChevronLeft}
            color="outline"
            onClick={() => {
              if (onBack) {
                onBack();
              }
            }}
          />
        </div>
      </div>
      <div className="bg-white h-full flex flex-col overflow-hidden">
        {selectedReq?.requestStatus === "pending" ||
        selectedReq?.requestStatus === "in_progress" ||
        selectedReq?.requestStatus === "approved" ? (
          <span className="text-[9px] xl:text-sm text-gray-600 font-medium p-2 xl:p-4">
            Note: Please wait for the order request to be delivered before
            receiving it. If it takes longer than expected, kindly contact your
            Purchasing Department.
          </span>
        ) : selectedReq?.requestStatus === "delivered" ? (
          <span className="text-[9px] xl:text-sm text-blue-600 font-medium p-2 xl:p-4">
            Note: Please verify all delivered items and accurately input the
            received quantities into the system to keep your inventory records
            up to date.
          </span>
        ) : selectedReq?.requestStatus === "received" ? (
          <span className="text-[9px] xl:text-sm text-blue-600 font-medium p-2 xl:p-4">
            Note: The request status is currently marked as Received. Please
            complete the request to finalize the process, ensure that all items
            are accurately recorded, and generate the corresponding inventory
            report.
          </span>
        ) : selectedReq?.requestStatus === "completed" ? (
          <span className="text-[9px] xl:text-sm text-blue-600 font-medium p-4">
            Note: This request order is completed.
          </span>
        ) : (
          <span className="text-[10px] xl:text-sm text-red-600 font-medium p-4">
            Note: This request has been cancelled. No further action is
            required.
          </span>
        )}
        <div className="flex-1 overflow-y-auto pr-4 pl-4">
          <Table
            localSearch
            renderTopActions={
              <div className="flex gap-2">
                {selectedReq?.requestStatus === "delivered" && (
                  <div>
                    <Button
                      icon={Plus}
                      onClick={() => {
                        //Perform add item from inventory from deliver
                      }}
                      size="sm"
                      label="Add Item from Deliver"
                      className="text-xs font-semibold"
                      color="secondary"
                    />
                  </div>
                )}
                {Boolean(
                  selectedReq?.requestStatus === "pending" ||
                  selectedReq?.requestStatus === "in_progress",
                ) && (
                  <div>
                    <Button
                      icon={Plus}
                      onClick={() => {
                        setShowAddItem(true);
                      }}
                      size="sm"
                      label="Add Item"
                      className="font-semibold"
                      color="primary"
                    />
                  </div>
                )}
              </div>
            }
            maxHeight="h-full"
            uniqueIdKey="reqItemId"
            showCheckBox={isSelectingAddItemPO}
            isRounded={false}
            updateData={setRequestItemData}
            columns={
              hasToFollowDelivered
                ? columnToFollow
                : hasPartialDelivered
                  ? column
                  : isRequestor
                    ? selectedReq?.requestStatus === "pending" ||
                      selectedReq?.requestStatus === "in_progress"
                      ? columnPending
                      : selectedReq?.requestStatus === "delivered"
                        ? column
                        : column
                    : adminColumn
            }
            data={requestItemData}
            loading={loading}
            onSelectionChange={handleRowSelection}
          />
        </div>
        <div className="border-t border-gray-300 flex justify-between p-1 xl:p-4 gap-4 items-center mt-auto">
          <span className="flex items-center">
            <Clock className="w-3 h-3 xl:w-4 xl:h-4" />{" "}
            <span className="text-[9px] xl:text-xs ml-2">
              {" "}
              Requested:{" "}
              {formatDateToWords(selectedReq?.requestCreatedAt ?? "")}{" "}
            </span>
          </span>
          <div className="flex gap-2">
            {selectedReq?.requestStatus !== "cancelled" && (
              <>
                <div>
                  <Button
                    icon={FileText}
                    onClick={() => {
                      handleDownloadPDF();
                      setShowROPDF(true);
                    }}
                    size="sm"
                    label="PDF"
                    className="text-xs font-semibold"
                    color="secondary"
                  />
                </div>
                {/* <div>
                <Button
                  icon={<Printer size={15} />}
                  size="sm"
                  label="Print"
                  className="text-xs font-semibold"
                  color="secondary"
                />
              </div> */}
                {isSelectingAddItemPO ? (
                  <>
                    <div>
                      <Button
                        icon={X}
                        onClick={() => {
                          setIsSelectingAddItemPO(false);
                        }}
                        size="sm"
                        label="Cancel"
                        className=" font-semibold"
                        color="secondary"
                      />
                    </div>
                    <div>
                      <Button
                        icon={Pencil}
                        onClick={() => {
                          setShowAddPOItem(true);
                        }}
                        size="sm"
                        label="Confirm Item"
                        className=" font-semibold"
                        color="primary"
                      />
                    </div>
                  </>
                ) : isRequestor ? (
                  <>
                    {showEditMode &&
                      selectedReq?.requestStatus === "pending" && (
                        <>
                          <div>
                            <Button
                              icon={X}
                              onClick={() => {
                                setShowEditMode(false);
                              }}
                              size="sm"
                              label="Cancel"
                              className="font-semibold"
                              color="secondary"
                              disabled={isEditting}
                            />
                          </div>
                          <div>
                            <Button
                              icon={Pencil}
                              onClick={() => {
                                handleSaveEditItem();
                              }}
                              size="sm"
                              label="Save"
                              className="font-semibold"
                              loading={isEditting}
                              color="primary"
                            />
                          </div>
                        </>
                      )}
                    {!showEditMode &&
                      selectedReq?.requestStatus === "pending" && (
                        <div>
                          <Button
                            icon={Pencil}
                            onClick={() => {
                              setShowEditMode(true);
                            }}
                            size="sm"
                            label="Edit"
                            className="font-semibold"
                            color="secondary"
                          />
                        </div>
                      )}
                    {Boolean(
                      (selectedReq?.requestStatus === "approved" ||
                        selectedReq?.requestStatus === "in_progress") &&
                      !hasPartialDelivered,
                    ) && (
                      <div>
                        <Button
                          icon={Plus}
                          onClick={() => {
                            setShowAddItem(true);
                          }}
                          size="sm"
                          label="Add Item"
                          className="font-semibold"
                          color="success"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  Boolean(
                    selectedReq?.requestStatus === "approved" ||
                    selectedReq?.requestStatus === "in_progress",
                  ) && (
                    <div>
                      <Button
                        icon={Pencil}
                        onClick={() => {
                          setIsSelectingAddItemPO(true);
                        }}
                        size="sm"
                        label="Add Item to PO"
                        className=" font-semibold"
                        color="primary"
                      />
                    </div>
                  )
                )}

                {/* Conditional buttons based on status */}
                {selectedReq?.requestStatus === "received" && (
                  <div>
                    <Button
                      icon={CheckLine}
                      onClick={handleCompleteRO}
                      size="sm"
                      label="Complete Request"
                      className="text-xs font-semibold"
                    />
                  </div>
                )}
                {(selectedReq?.requestStatus === "delivered" ||
                  hasPartialDelivered) && (
                  <div>
                    <Button
                      icon={CheckLine}
                      onClick={handleFillUpAll}
                      size="sm"
                      label="Fill up received"
                      className="text-xs font-semibold"
                      color="success"
                    />
                  </div>
                )}
                {(selectedReq?.requestStatus === "delivered" ||
                  hasPartialDelivered ||
                  hasToFollowDelivered) && (
                  <div>
                    <Button
                      icon={CheckLine}
                      onClick={() => {
                        const hasNoQuantityReceived = requestItemData.some(
                          (item) =>
                            Number(item.reqItemReceived) === 0 &&
                            item.reqItemStatus !== "not_ordered",
                        );
                        console.log({ requestItemData });
                        const hasNoQuantityToFollowReceived =
                          requestItemData.some(
                            (item) =>
                              (Number(item.receivedToFollow) === 0 ||
                                item.receivedToFollow === undefined) &&
                              item.reqItemStatus === "delivered" &&
                              Number(item.reqItemToFollow) !== 0,
                          );
                        const validReceivedData = requestItemData.filter(
                          (i) =>
                            i.reqItemStatus === "delivered" ||
                            i.reqItemStatus === "partial",
                        );
                        console.log({ validReceivedData });
                        if (hasNoQuantityToFollowReceived) {
                          toast.error(
                            "Cannot received 0 quantity from to follow items.!",
                          );
                          return;
                        }
                        if (hasNoQuantityReceived) {
                          toast.error("Cannot received 0 quantity item!");
                          return;
                        }

                        setShowReceivedConfirmation(true);
                      }}
                      size="sm"
                      label="Received"
                      className="text-xs font-semibold"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Modal
        className="h-[95%]"
        isOpen={showROPDF}
        size="xl"
        onClose={function (): void {
          setShowROPDF(false);
        }}
        title="Request Order PDF"
      >
        {" "}
        <PDFViewer width="100%" height="100%">
          <RequestOrderPDF data={pdfData ?? null} />
        </PDFViewer>
      </Modal>
      <Popup
        background="transparent"
        isOpen={showAddItem}
        onClose={function (): void {
          setShowAddItem(false);
        }}
        title="Add Item for Request"
      >
        <AddItemROModal
          loading={isAddingItem}
          inventoryId={getOverAllInventoryId ?? 0}
          requestId={selectedReq?.requestId ?? 0}
          requestInventoryItem={getAllInventoryItemIdInRequest ?? []}
          onSubmit={handleAddItemRequest}
          mutate={mutate}
          onClose={function (): void {
            setShowAddItem(false);
          }}
        />
      </Popup>
      <Popup
        background="transparent"
        isOpen={showAddPOItem}
        onClose={function (): void {
          setShowAddPOItem(false);
        }}
        title="Add Item for PO"
      >
        <AddItemPOModal
          data={selectedRows}
          requestId={selectedReq?.requestId ?? 0}
          onSubmit={handleAddItemPurchaser}
          loading={isAddingItemPo}
        />
      </Popup>
      <Modal
        title="Received Confirmation"
        isOpen={showReceivedConfirmation}
        onClose={function (): void {
          setShowReceivedConfirmation(false);
        }}
      >
        <div className="flex flex-col">
          <div className="text-center">
            <span>
              Are you sure you want to receive these items and add them to your
              inventory?
            </span>
          </div>
          <div className="flex justify-end gap-4">
            <div>
              <Button
                label="Cancel"
                size="sm"
                onClick={() => {
                  setShowReceivedConfirmation(false);
                }}
                hasBorder
                color="secondary"
                disabled={isReceiving}
              />
            </div>
            <div>
              <Button
                label="Confirm"
                size="sm"
                loading={isReceiving}
                onClick={() => {
                  handleReceivedRO();
                }}
                hasBorder
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ViewRequestModal;
