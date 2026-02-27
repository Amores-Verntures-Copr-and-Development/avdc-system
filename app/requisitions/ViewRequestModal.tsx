import RequestOrderPDF from "@/components/pdf/RequestOrderPDF";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";

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

import { Checkbox, pdf, PDFViewer } from "@react-pdf/renderer";
import {
  CheckLine,
  ChevronLeft,
  Clock,
  Download,
  Eye,
  FileText,
  Package,
  PackageCheck,
  PackageSearch,
  Pencil,
  Plus,
  Repeat,
  Trash,
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
import { formatPeso } from "@/utils/formatPeso";

import Popup from "@/components/shared/PopupModal";
import IconButton from "@/components/shared/IconButton";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import ReceiveItemComponent from "./components/ReceiveItemComponent";

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
  const [filteredStatus, setFilteredStatus] = useState<
    "" | "delivered" | "received" | "not_ordered" | "pending"
  >("");
  const [selectedRow, setSelectedRow] = useState<DisplayRequestItems | null>(
    null,
  );

  const [showReceiveItemModal, setShowReceiveItemModal] = useState(false);
  const [selectedRowItem, setSelectedRowItem] =
    useState<DisplayRequestItems | null>(null);
  const [showReceivedOneItem, setShowReceivedOneItem] = useState(false);
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
  const [showNotOrderedConfirmation, setShowNotOrderedConfirmation] =
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
    if (!itemResponse.data?.length || !selectedReq?.requestNo) return;

    const saved: DisplayRequestItems[] = JSON.parse(
      localStorage.getItem(`${selectedReq.requestNo}-request-item-draft`) ||
        "[]",
    );

    const mergedData = itemResponse.data.map((item) => {
      const savedItem = saved.find((s) => s.reqItemId === item.reqItemId);

      if (!savedItem) return item;

      // ✅ Server wins if already delivered/received
      const serverStatus = item.reqItemStatus;
      const draftStatus = savedItem.reqItemStatus;

      const shouldUseDraft = serverStatus === "pending";

      return shouldUseDraft
        ? {
            ...item,
            reqItemReceived: savedItem.reqItemReceived,
            reqItemStatus: draftStatus,
          }
        : item;
    });

    setRequestItemData(mergedData);
    setOriginalData(itemResponse.data);
  }, [itemResponse.data, selectedReq?.requestNo]);
  const status = [
    { value: "", label: "All" },
    {
      value: "pending",
      label: `Pending Items (${requestItemData?.filter((i) => i.reqItemStatus === "pending").length})`,
    },

    {
      value: "delivered",
      label: `Delivered Items (${requestItemData?.filter((i) => i.reqItemStatus === "delivered").length})`,
    },
    {
      value: "received",
      label: `Received Items (${requestItemData?.filter((i) => i.reqItemStatus === "received").length})`,
    },
    {
      value: "not_ordered",
      label: `Not Ordered (${requestItemData?.filter((i) => i.reqItemStatus === "not_ordered").length})`,
    },
  ];
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
  ];
  const adminColumn: Column<DisplayRequestItems>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { name: "Name", key: "itemName" },
    { name: "Unit", key: "itemUnit" },
    {
      name: "Unit Price",
      key: "unitPrice",
      selector: (row) => <span>{formatPeso(row.unitPrice)}</span>,
    },
    {
      name: "Request Qty",
      key: "reqItemQuantity",
      selector: (row) =>
        selectedReq?.requestStatus === "pending" ||
        selectedReq?.requestStatus === "approved" ||
        selectedReq?.requestStatus === "in_progress" ? (
          <span className="font-semibold">{row.reqItemQuantity}</span>
        ) : (
          row.reqItemQuantity
        ),
    },
    {
      name: "Delivered Qty",
      key: "reqItemTransfer",
      selector: (row) =>
        ["delivered", "completed"].includes(
          selectedReq?.requestStatus ?? "",
        ) ? (
          <span className="font-semibold">{row.reqItemTransfer}</span>
        ) : (
          row.reqItemTransfer
        ),
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
    {
      name: "Received",
      key: "reqItemReceived",
      selector: (row) =>
        ["recieved", "completed"].includes(selectedReq?.requestStatus ?? "") ? (
          <span className="font-semibold">{row.reqItemReceived}</span>
        ) : (
          row.reqItemReceived
        ),
    },
    {
      name: "Total",
      key: "uniPrice",
      selector: (row) => {
        if (row.reqItemStatus === "not_ordered") {
          return <span className="font-semibold"></span>;
        }
        if (row.reqItemStatus === "delivered") {
          return (
            <span className="font-semibold">
              {formatPeso(Number(row.unitPrice) * Number(row.reqItemTransfer))}
            </span>
          );
        }
        if (row.reqItemStatus === "received") {
          return (
            <span className="font-semibold">
              {formatPeso(Number(row.unitPrice) * Number(row.reqItemReceived))}
            </span>
          );
        }
        return (
          <span className="font-semibold">
            {formatPeso(Number(row.unitPrice) * Number(row.reqItemQuantity))}
          </span>
        );
      },
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
    },

    { name: "Remarks", key: "reqItemRemarks" },
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
        const isNotEditable =
          original?.reqItemStatus === "not_ordered" ||
          row.reqItemStatus === "not_ordered";

        const isEditableStatus =
          original?.reqItemStatus === "delivered" ||
          original?.reqItemStatus === "partial" ||
          row.reqItemStatus === "delivered";

        const isEditable = !isNotEditable && isEditableStatus;

        return isEditable;
        // return (
        //   // (original?.reqItemStatus === "delivered" ||
        //   //   original?.reqItemStatus === "partial") &&
        //   // (Number(row.receivedToFollow) === 0 ||
        //   //   !Number(row.receivedToFollow)) &&
        //   // Number(original.reqItemReceived) === 0

        //   (original?.reqItemStatus === "delivered" ||
        //     original?.reqItemStatus === "partial") &&
        //   Number(original.reqItemReceived) === 0
        // );
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
        const editableStatus = original?.reqItemStatus !== "not_ordered";
        const notEditableStatus = original?.reqItemStatus === "received";
        const isEditable = !notEditableStatus && editableStatus;
        return isEditable;
        // return (
        //   (row.reqItemStatus === "delivered" ||
        //     (selectedReq?.requestStatus === "delivered" &&
        //       original?.reqItemStatus !== "not_ordered")) &&
        //   original?.reqItemStatus !== "received"
        // );
      },

      inputType: "select",
      selectOptionVariant: "custom", // ✅ matches interface
      options: (row) => {
        const original = findOriginalData(row.reqItemId);
        if (original?.reqItemStatus === "pending") {
          if (hasItemDeliver) {
            return [
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
            ];
          }
          return [
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
          ];
        }
        if (original?.reqItemStatus === "delivered") {
          return [
            {
              label: "Not Ordered",
              value: "not_ordered",
              bg: "bg-red-100",
              color: "text-red-600",
            },
            {
              label: "Delivered",
              value: "delivered",
              bg: "bg-yellow-100",
              color: "text-yellow-700",
            },
          ];
        }
        return [
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
        ];
      },

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
      console.log(_e);
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

  const handleDownload = async () => {
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
    const blob = await pdf(<RequestOrderPDF data={pdfData} />).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RequestOrder-${selectedReq?.requestNo}.pdf`;
    a.click();

    URL.revokeObjectURL(url);
  };
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
    const status =
      selectedReq?.requestStatus === "delivered" ||
      selectedReq?.requestStatus === "received"
        ? "delivered"
        : "pending";
    const requestItem: CreateRequestItemDto = {
      ...data,
      reqItemStatus: status,
    };
    const arrayData = [requestItem];
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

  const hasItemReceive = requestItemData.some(
    (i) => i.reqItemStatus === "delivered",
  );
  const hasItemDeliver = requestItemData.some(
    (i) => i.reqItemStatus === "delivered",
  );
  const hasSomeNotOrdered = requestItemData.some(
    (i) =>
      i.reqItemStatus === "not_ordered" &&
      findOriginalData(i.reqItemId)?.reqItemStatus !== "not_ordered",
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
  const getTotalCost = (() => {
    if (!selectedReq) return 1;
    if (["rejected", "cancelled"].includes(selectedReq.requestStatus ?? "")) {
      return 0;
    }

    if (!["pending"].includes(selectedReq.requestStatus ?? "")) {
      return requestItemData.reduce(
        (sum, item) =>
          sum + Number(item.reqItemTransfer) * Number(item.unitPrice),
        0,
      );
    }

    return requestItemData.reduce(
      (sum, item) =>
        sum + Number(item.reqItemQuantity) * Number(item.unitPrice),
      0,
    );
  })();

  const handleReceiveItem = async () => {
    if (!selectedRowItem || !selectedReq) return;

    setIsReceiving(true);

    try {
      const receiveItem: Partial<Request> = {
        ...selectedReq,
        requestItems: [{ ...selectedRowItem }],
      };
      console.log(receiveItem);
      const sendData = {
        controller: "received",
        data: [receiveItem],
      };

      const result = await fetch(`api/requests/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendData),
      });

      const res = await result.json();

      if (!res.success) throw new Error(res.err);

      // only call once
      const updatedData = await mutate();

      mutateRequest(); // refresh request list

      if (updatedData?.data) {
        const beforeItem = originalData.find(
          (i) => i.reqItemId === selectedRowItem.reqItemId,
        );

        const afterItem = updatedData.data.find(
          (i) => i.reqItemId === selectedRowItem.reqItemId,
        );

        const isStatusChanged =
          beforeItem?.reqItemStatus !== afterItem?.reqItemStatus;

        if (isStatusChanged && afterItem) {
          const key = `${selectedReq.requestNo}-request-item-draft`;

          const saved: DisplayRequestItems[] = JSON.parse(
            localStorage.getItem(key) || "[]",
          );

          const updatedSaved = saved.map((item) =>
            item.reqItemId === afterItem.reqItemId
              ? { ...item, ...afterItem }
              : item,
          );

          localStorage.setItem(key, JSON.stringify(updatedSaved));
          setRequestItemData(updatedSaved);
        }

        setOriginalData(updatedData.data);
      }
      toast.success(
        `Received ${selectedRowItem.reqItemReceived} ${selectedRowItem.itemName} successfully!`,
      );
      setShowReceivedOneItem(false);
      setSelectedRowItem(null);

      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to update Inventory.");
      return false;
    } finally {
      setIsReceiving(false);
    }
  };

  const handleNotOrderedItem = async () => {
    if (!selectedRowItem || !selectedReq) return;

    setIsReceiving(true);

    try {
      const receiveItem: Partial<RequestItems>[] = [selectedRowItem];

      const sendData = {
        controller: "not_ordered",
        data: receiveItem,
      };

      const result = await fetch(`/api/requests/request-items/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendData),
      });

      const res = await result.json();

      if (!res.success) throw new Error(res.err);

      // only call once
      const updatedData = await mutate();

      mutateRequest(); // refresh request list

      if (updatedData?.data) {
        const beforeItem = originalData.find(
          (i) => i.reqItemId === selectedRowItem.reqItemId,
        );

        const afterItem = updatedData.data.find(
          (i) => i.reqItemId === selectedRowItem.reqItemId,
        );

        const isStatusChanged =
          beforeItem?.reqItemStatus !== afterItem?.reqItemStatus;

        if (isStatusChanged && afterItem) {
          const key = `${selectedReq.requestNo}-request-item-draft`;

          const saved: DisplayRequestItems[] = JSON.parse(
            localStorage.getItem(key) || "[]",
          );

          const updatedSaved = saved.map((item) =>
            item.reqItemId === afterItem.reqItemId
              ? { ...item, ...afterItem }
              : item,
          );

          localStorage.setItem(key, JSON.stringify(updatedSaved));
          setRequestItemData(updatedSaved);
        }

        setOriginalData(updatedData.data);
      }
      toast.success(
        `${selectedRowItem.itemName} mark as not ordered successfully!`,
      );
      setShowNotOrderedConfirmation(false);
      setSelectedRowItem(null);

      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to update Inventory.");
      return false;
    } finally {
      setIsReceiving(false);
    }
  };
  const isReadyToCompleteRequest =
    originalData
      .filter((i) => i.reqItemStatus !== "not_ordered")
      .every((i) => i.reqItemStatus === "received") &&
    !["completed"].includes(selectedReq?.requestStatus ?? "");
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
        <div className="flex flex-col gap-2">
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
        <div className=" grid grid-cols-1 p-2">
          {/* Left note */}
          {user?.storeId && (
            <div className="flex-1 items-start">
              {" "}
              {/* flex-1 keeps it on left but allows right to stay */}
              {selectedReq?.requestStatus === "pending" ||
              selectedReq?.requestStatus === "in_progress" ||
              selectedReq?.requestStatus === "approved" ? (
                <span className="text-[9px] xl:text-sm text-gray-600 font-medium">
                  Note: Please wait for the order request to be delivered before
                  receiving it. If it takes longer than expected, kindly contact
                  your Purchasing Department.
                </span>
              ) : selectedReq?.requestStatus === "delivered" ? (
                <span className="text-[9px] xl:text-sm text-blue-600 font-medium">
                  Note: Please verify all delivered items and accurately input
                  the received quantities into the system to keep your inventory
                  records up to date.
                </span>
              ) : selectedReq?.requestStatus === "received" ? (
                <span className="text-[9px] xl:text-sm text-blue-600 font-medium">
                  Note: The request status is currently marked as Received.
                  Please complete the request to finalize the process, ensure
                  that all items are accurately recorded, and generate the
                  corresponding inventory report.
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
            </div>
          )}
          {/* Right total */}
          {Boolean(
            !["supervisor", "staff"].includes(user?.empPosition ?? ""),
          ) && (
            <div className="flex flex-col items-end gap-1">
              {" "}
              {/* items-end to stick to right */}
              <span className="text-[9px] 2xl:text-sm text-gray-500">
                Total
              </span>
              <span className="text-xs sm:text-lg font-semibold">
                {formatPeso(getTotalCost)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto pr-4 pl-4">
          <Table
            // localFilterKey={"reqItemStatus"}
            // localFilterValue={filteredStatus}
            localFilter={{
              keys: ["reqItemStatus"],
              values: { reqItemStatus: filteredStatus || "pending" },
            }}
            showActions
            addContentLeftTitle={
              <div className="flex gap-2">
                {status.map((s, index) => (
                  <div key={index}>
                    <Button
                      label={s.label}
                      size="sm"
                      color={
                        s.value === filteredStatus
                          ? s.value === ""
                            ? "primary"
                            : s.value === "pending"
                              ? "tertiary"
                              : s.value === "delivered"
                                ? "warning"
                                : s.value === "received"
                                  ? "success"
                                  : "danger"
                          : "secondary"
                      }
                      onClick={() => {
                        setFilteredStatus(
                          s.value as
                            | ""
                            | "delivered"
                            | "received"
                            | "not_ordered",
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            }
            renderActions={(row) => {
              const findOriginalData = originalData.find(
                (i) => i.reqItemId === row.reqItemId,
              );
              return (
                <div className="flex justify-center gap-2">
                  {row.reqItemStatus === "pending" && (
                    <IconButton
                      onClick={() => {
                        // handleEditRow(row);
                        setShowReceiveItemModal(true);
                        setSelectedRow(row);
                      }}
                      label={"Receive Item"}
                      bg={"green"}
                      icon={<PackageCheck className="w-3 h-3 xl:w-4 xl:h-4" />}
                    />
                  )}
                  {selectedReq?.requestStatus === "pending" && (
                    <IconButton
                      onClick={() => {
                        // handleEditRow(row);
                        // setIsShowViewRequest(true);
                        // setSelectedRow(row);
                      }}
                      label={"Edit"}
                      bg={"gray"}
                      icon={<Pencil className="w-3 h-3 xl:w-4 xl:h-4" />}
                    />
                  )}
                  {selectedReq?.requestStatus === "pending" && (
                    <IconButton
                      onClick={() => {
                        // handleEditRow(row);
                        // setIsShowViewRequest(true);
                        // setSelectedRow(row);
                      }}
                      label={"Remove from request"}
                      bg={"red"}
                      icon={<Trash className="w-3 h-3 xl:w-4 xl:h-4" />}
                    />
                  )}

                  {(row.reqItemStatus === "delivered" ||
                    row.reqItemStatus === "partial") && (
                    <>
                      {" "}
                      <IconButton
                        onClick={() => {
                          console.log({ row });

                          console.log({ findOriginalData });
                          if (Number(row.reqItemReceived) === 0) {
                            toast.error("No quantity to receive!");
                            return;
                          }
                          setSelectedRowItem(row);
                          setShowReceivedOneItem(true);
                        }}
                        label={"Receive Item"}
                        bg={"green"}
                        icon={<Package className="w-3 h-3 xl:w-4 xl:h-4" />}
                      />
                      <IconButton
                        onClick={() => {
                          console.log({ row });

                          console.log({ findOriginalData });
                          if (Number(row.reqItemReceived) === 0) {
                            toast.error("No quantity to receive!");
                            return;
                          }
                          setSelectedRowItem(row);
                          setShowReceivedOneItem(true);
                        }}
                        label={"Convert and Receive"}
                        bg={"primary"}
                        icon={<Repeat className="w-3 h-3 xl:w-4 xl:h-4" />}
                      />
                    </>
                  )}
                  {row.reqItemStatus === "not_ordered" &&
                    findOriginalData?.reqItemStatus !== "not_ordered" && (
                      <IconButton
                        onClick={() => {
                          console.log({ row });

                          console.log({ findOriginalData });

                          setSelectedRowItem(row);
                          setShowNotOrderedConfirmation(true);
                        }}
                        label={"Not Order Item"}
                        bg={"red"}
                        icon={<X className="w-3 h-3 xl:w-4 xl:h-4" />}
                      />
                    )}
                </div>
              );
            }}
            localSearch
            renderTopActions={
              <div className="flex gap-2">
                <div></div>
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
                {!["completed", "received"].includes(
                  selectedReq?.requestStatus ?? "",
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
              isRequestor
                ? hasToFollowDelivered
                  ? columnToFollow
                  : hasPartialDelivered || hasItemDeliver || hasSomeNotOrdered
                    ? column
                    : selectedReq?.requestStatus === "pending" ||
                        selectedReq?.requestStatus === "in_progress"
                      ? hasItemReceive
                        ? column
                        : column
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
                    icon={Download}
                    onClick={() => {
                      handleDownload();
                    }}
                    size="sm"
                    label="Download PDF"
                    className="text-xs font-semibold"
                    color="secondary"
                  />
                </div>
                <div>
                  <Button
                    icon={FileText}
                    onClick={() => {
                      handleDownloadPDF();
                      setShowROPDF(true);
                    }}
                    size="sm"
                    label="View PDF"
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
                {(selectedReq?.requestStatus === "received" ||
                  isReadyToCompleteRequest) && (
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
                {hasSomeNotOrdered &&
                  !["completed", "received"].includes(
                    selectedReq?.requestStatus ?? "",
                  ) && (
                    <div>
                      <Button
                        icon={X}
                        color="danger"
                        onClick={() => {
                          const validNotOrderedData = requestItemData.filter(
                            (reqItem) =>
                              originalData.some(
                                (origItem) =>
                                  origItem.itemId === reqItem.itemId &&
                                  origItem.reqItemStatus === "not_ordered",
                              ),
                          );

                          if (!validNotOrderedData) {
                            toast.error("No item to mark as not order");
                            return;
                          }

                          setShowNotOrderedConfirmation(true);
                        }}
                        size="sm"
                        label="Mark as not order"
                        className="text-xs font-semibold"
                      />
                    </div>
                  )}
                {(selectedReq?.requestStatus === "delivered" ||
                  hasPartialDelivered ||
                  hasToFollowDelivered ||
                  hasItemDeliver) && (
                  <div>
                    <Button
                      icon={CheckLine}
                      onClick={() => {
                        const validReceivedData = requestItemData.filter(
                          (i) =>
                            i.reqItemStatus === "delivered" ||
                            i.reqItemStatus === "partial",
                        );
                        const hasNoQuantityReceived = validReceivedData.some(
                          (item) =>
                            Number(item.reqItemReceived) === 0 &&
                            item.reqItemStatus !== "not_ordered",
                        );

                        const hasNoQuantityToFollowReceived =
                          validReceivedData.some(
                            (item) =>
                              (Number(item.receivedToFollow) === 0 ||
                                item.receivedToFollow === undefined) &&
                              item.reqItemStatus === "delivered" &&
                              Number(item.reqItemToFollow) !== 0,
                          );

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
      <ConfirmationModal
        onConfirm={function (): void {
          handleReceiveItem();
        }}
        confirmationInfo={`Are you sure you want to receive ${selectedRowItem?.reqItemReceived} ${selectedRowItem?.itemName}?`}
        onClose={function (): void {
          setShowReceivedOneItem(false);
          setSelectedRowItem(null);
        }}
        isShow={showReceivedOneItem && selectedRowItem !== null}
        title={`Received Item`}
        isLoading={isReceiving}
      />
      <ConfirmationModal
        onConfirm={function (): void {
          handleNotOrderedItem();
        }}
        confirmationInfo={`Are you sure you want to mark as not order  ${selectedRowItem?.itemName} in your request?`}
        onClose={function (): void {
          setShowNotOrderedConfirmation(false);
          setSelectedRowItem(null);
        }}
        isShow={showNotOrderedConfirmation && selectedRowItem !== null}
        title={`Received Item`}
        isLoading={isReceiving}
      />
      <ConfirmationModal
        onConfirm={function (): void {
          handleNotOrderedItem();
        }}
        confirmationInfo={`Are you sure you want to mark as not order  ${selectedRowItem?.itemName} in your request?`}
        onClose={function (): void {
          setShowNotOrderedConfirmation(false);
          setSelectedRowItem(null);
        }}
        isShow={showNotOrderedConfirmation && selectedRowItem !== null}
        title={`Received Item`}
        isLoading={isReceiving}
      />
      {/* <Modal
        title={`Receive ${selectedRow?.itemName}`}
        isOpen={showReceiveItemModal}
        onClose={function (): void {
          setShowReceiveItemModal(false);

          setSelectedRow(null);
        }}
      >
        <div></div>
      </Modal> */}
      <Popup
        title={`Receive ${selectedRow?.itemName}`}
        isOpen={showReceiveItemModal}
        onClose={function (): void {
          setShowReceiveItemModal(false);

          setSelectedRow(null);
        }}
        background="bg-white/20"
      >
        <ReceiveItemComponent
          data={selectedRow}
          mutate={() => {
            mutate();
            mutateRequest();
          }}
          onClose={function (): void {
            setShowReceiveItemModal(false);

            setSelectedRow(null);
          }}
        />
      </Popup>
    </>
  );
};

export default ViewRequestModal;
