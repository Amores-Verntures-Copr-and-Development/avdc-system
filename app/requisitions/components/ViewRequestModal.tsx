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
import { Request } from "@/types/request";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";

import { PDFViewer } from "@react-pdf/renderer";
import { CheckLine, Clock, FileText, Pencil, Plus, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import AddItemROModal from "./AddItemROModal";
import AddItemPOModal from "./AddItemPOModal";
import { CreatePurchaseOrderItemDto } from "@/dtos/purchase.dto";

interface ViewRequestModalProps {
  selectedReq: DisplayRequestOrderDto | null;
  mutateRequest: () => void;
  user: UserAuth | null;
}
const ViewRequestModal: React.FC<ViewRequestModalProps> = ({
  selectedReq,
  mutateRequest,
  user,
}) => {
  const [isSelectingAddItemPO, setIsSelectingAddItemPO] = useState(false);
  const [showAddPOItem, setShowAddPOItem] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingItemPo, setIsAddingItemPo] = useState(false);
  const [requestItemData, setRequestItemData] = useState<DisplayRequestItems[]>(
    []
  );
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
    fetcher
  );
  useEffect(() => {
    if (itemResponse.data && itemResponse.data.length > 0) {
      setRequestItemData(itemResponse.data);
    }
  }, [itemResponse.data]);
  const updatedItemsRef = useRef<DisplayRequestItems[]>([]);

  const isRequestor =
    user?.empPosition === "staff" || user?.empPosition === "supervisor";
  const columnPending: Column<DisplayRequestItems>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { name: "Name", key: "itemName" },
    { name: "Unit", key: "itemUnit" },
    {
      name: "Request Qty",
      key: "reqItemQuantity",
      selector: (row) =>
        formatQuantityByUnit(row.reqItemQuantity, row.itemUnit),
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

  const column: Column<DisplayRequestItems>[] = [
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
      editable: (row) =>
        row.reqItemStatus === "delivered" ||
        selectedReq?.requestStatus === "delivered",
      inputType: "number",
    },
  ];
  const handleReceivedRO = async () => {
    const requestData: Partial<Request>[] = [
      {
        ...selectedReq,
        requestItems: requestItemData,
      },
    ];
    const sendData = {
      controller: "received",
      data: requestData,
    };
    console.log("SendDatA: ", sendData);
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
      mutateRequest();
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to update Inventory.");
      return false;
    }
  };
  const handleCompleteRO = async () => {
    const updatedItems = updatedItemsRef.current;
    const requestData: Partial<Request>[] = [
      {
        ...selectedReq,
        requestItems: updatedItems,
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
    (item) => item.inventoryId
  )
    ? itemResponse.data[0]?.inventoryId
    : null;
  const getAllInventoryItemIdInRequest = itemResponse.data.map(
    (item) => item.invItem
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
        }
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
    poId: number
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
        prev.map((item) => ({
          ...item,
          reqItemReceived: item.reqItemQuantity, // or any value you want
        }))
      );
    }
  };
  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      {selectedReq?.requestStatus === "pending" ||
      selectedReq?.requestStatus === "in_progress" ||
      selectedReq?.requestStatus === "approved" ? (
        <span className="text-[10px] xl:text-sm text-gray-600 font-medium p-4">
          Note: Please wait for the order request to be delivered before
          receiving it. If it takes longer than expected, kindly contact your
          Purchasing Department.
        </span>
      ) : selectedReq?.requestStatus === "delivered" ? (
        <span className="text-[10px] xl:text-sm text-blue-600 font-medium p-4">
          Note: Please verify all delivered items and accurately input the
          received quantities into the system to keep your inventory records up
          to date.
        </span>
      ) : selectedReq?.requestStatus === "received" ? (
        <span className="text-[10px] xl:text-sm text-blue-600 font-medium p-4">
          Note: The request status is currently marked as Received. Please
          complete the request to finalize the process, ensure that all items
          are accurately recorded, and generate the corresponding inventory
          report.
        </span>
      ) : selectedReq?.requestStatus === "completed" ? (
        <span className="text-[10px] xl:text-sm text-blue-600 font-medium p-4">
          Note: This request order is completed.
        </span>
      ) : (
        <span className="text-[10px] xl:text-sm text-red-600 font-medium p-4">
          Note: This request has been cancelled. No further action is required.
        </span>
      )}
      <div className="flex-1 overflow-y-auto pr-4 pl-4">
        <Table
          localSearch
          renderTopActions={
            selectedReq?.requestStatus === "delivered" && (
              <div>
                <Button
                  icon={<Plus size={15} />}
                  onClick={() => {
                    //Perform add item from inventory from deliver
                  }}
                  size="sm"
                  label="Add Item from Deliver"
                  className="text-xs font-semibold"
                  color="secondary"
                />
              </div>
            )
          }
          maxHeight="h-full"
          uniqueIdKey="reqItemId"
          showCheckBox={isSelectingAddItemPO}
          isRounded={false}
          updateData={setRequestItemData}
          columns={
            isRequestor
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
      <div className="border-t border-gray-300 flex justify-between p-4 gap-4 items-center mt-auto">
        <span className="flex items-center">
          <Clock size={15} />{" "}
          <span className="text-xs ml-2">
            {" "}
            Requested: {formatDateToWords(
              selectedReq?.requestCreatedAt ?? ""
            )}{" "}
          </span>
        </span>
        <div className="flex gap-2">
          {selectedReq?.requestStatus !== "cancelled" && (
            <>
              <div>
                <Button
                  icon={<FileText size={15} />}
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
                      icon={<X size={15} />}
                      onClick={() => {
                        setIsSelectingAddItemPO(false);
                      }}
                      size="sm"
                      label="Cancel"
                      className="text-xs font-semibold"
                      color="secondary"
                    />
                  </div>
                  <div>
                    <Button
                      icon={<Pencil size={15} />}
                      onClick={() => {
                        setShowAddPOItem(true);
                      }}
                      size="sm"
                      label="Confirm Item"
                      className="text-xs font-semibold"
                      color="primary"
                    />
                  </div>
                </>
              ) : isRequestor ? (
                <>
                  <div>
                    <Button
                      icon={<Pencil size={15} />}
                      onClick={handleReceivedRO}
                      size="sm"
                      label="Edit"
                      className="text-xs font-semibold"
                      color="secondary"
                    />
                  </div>
                  {Boolean(
                    selectedReq?.requestStatus === "approved" ||
                      selectedReq?.requestStatus === "in_progress"
                  ) && (
                    <div>
                      <Button
                        icon={<Plus size={15} />}
                        onClick={() => {
                          setShowAddItem(true);
                        }}
                        size="sm"
                        label="Add Item"
                        className="text-xs font-semibold"
                        color="primary"
                      />
                    </div>
                  )}
                </>
              ) : (
                Boolean(
                  selectedReq?.requestStatus === "approved" ||
                    selectedReq?.requestStatus === "in_progress"
                ) && (
                  <div>
                    <Button
                      icon={<Pencil size={15} />}
                      onClick={() => {
                        setIsSelectingAddItemPO(true);
                      }}
                      size="sm"
                      label="Add Item to PO"
                      className="text-xs font-semibold"
                      color="primary"
                    />
                  </div>
                )
              )}

              {/* Conditional buttons based on status */}
              {selectedReq?.requestStatus === "received" && (
                <div>
                  <Button
                    icon={<CheckLine size={15} />}
                    onClick={handleCompleteRO}
                    size="sm"
                    label="Complete Request"
                    className="text-xs font-semibold"
                  />
                </div>
              )}
              {selectedReq?.requestStatus === "delivered" && (
                <div>
                  <Button
                    icon={<CheckLine size={15} />}
                    onClick={handleFillUpAll}
                    size="sm"
                    label="Fill up received"
                    className="text-xs font-semibold"
                    color="success"
                  />
                </div>
              )}
              {selectedReq?.requestStatus === "delivered" && (
                <div>
                  <Button
                    icon={<CheckLine size={15} />}
                    onClick={handleReceivedRO}
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
    </div>
  );
};

export default ViewRequestModal;
