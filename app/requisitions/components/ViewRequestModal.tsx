import PDFReview from "@/components/pdf/PDFReview";
import RequestOrderPDF from "@/components/pdf/RequestOrderPDF";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayRequestItems,
  DisplayRequestOrderDto,
  RequestOrderPdf,
} from "@/dtos/request.dto";
import { Request, RequestItems } from "@/types/request";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import { PDFViewer } from "@react-pdf/renderer";
import {
  Check,
  CheckLine,
  Clock,
  Download,
  Pencil,
  Printer,
} from "lucide-react";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface ViewRequestModalProps {
  selectedReq: DisplayRequestOrderDto | null;
  mutateRequest: () => void;
}
const ViewRequestModal: React.FC<ViewRequestModalProps> = ({
  selectedReq,
  mutateRequest,
}) => {
  const [showROPDF, setShowROPDF] = useState(false);
  const [pdfData, setPdfData] = useState<RequestOrderPdf | null>(null);
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
  const updatedItemsRef = useRef<DisplayRequestItems[]>([]);
  const handleDataUpdate = (updatedData: DisplayRequestItems[]) => {
    updatedItemsRef.current = updatedData;
  };
  console.log({ selectedReq });
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
        row.reqItemStatus === "delivered" &&
        selectedReq?.requestStatus === "delivered",
      inputType: "number",
    },
  ];
  const handleReceivedRO = async () => {
    const updatedItems = updatedItemsRef.current;
    const requestData: Partial<Request>[] = [
      {
        ...selectedReq,
        requestItems: updatedItems,
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
      toast.error("Failed to update Inventory.");
      return false;
    }
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
      },
    };
    setPdfData(pdfData);
  };
  return (
    <div className="flex-col flex">
      {selectedReq?.requestStatus === "pending" ||
      selectedReq?.requestStatus === "in_progress" ||
      selectedReq?.requestStatus === "approved" ? (
        <span className="text-sm text-gray-600 font-medium p-4">
          Note: Please wait for the order request to be delivered before
          receiving it. If it takes longer than expected, kindly contact your
          Purchasing Department.
        </span>
      ) : selectedReq?.requestStatus === "delivered" ? (
        <span className="text-sm text-blue-600 font-medium p-4">
          Note: Please verify all delivered items and accurately input the
          received quantities into the system to keep your inventory records up
          to date.
        </span>
      ) : selectedReq?.requestStatus === "received" ? (
        <span className="text-sm text-blue-600 font-medium p-4">
          Note: The request status is currently marked as Received. Please
          complete the request to finalize the process, ensure that all items
          are accurately recorded, and generate the corresponding inventory
          report.
        </span>
      ) : selectedReq?.requestStatus === "completed" ? (
        <span className="text-sm text-blue-600 font-medium p-4">
          Note: This request order is completed.
        </span>
      ) : (
        <span className="text-sm text-red-600 font-medium p-4">
          Note: This request has been cancelled. No further action is required.
        </span>
      )}
      <div className="p-4">
        <Table
          isRounded={false}
          updateData={handleDataUpdate}
          columns={
            selectedReq?.requestStatus === "pending" ||
            selectedReq?.requestStatus === "in_progress"
              ? columnPending
              : selectedReq?.requestStatus === "delivered"
              ? column
              : column
          }
          data={itemResponse.data}
          loading={loading}
        />
      </div>
      <div className="border-t-1 border-gray-300 flex justify-between p-4 gap-4 items-center ">
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
                  icon={<Download size={15} />}
                  onClick={() => {
                    handleDownloadPDF();
                    setShowROPDF(true);
                  }}
                  size="sm"
                  label="Download PDF"
                  className="text-xs font-semibold"
                  color="nocolor"
                />
              </div>
              <div>
                <Button
                  icon={<Printer size={15} />}
                  onClick={handleReceivedRO}
                  size="sm"
                  label="Print"
                  className="text-xs font-semibold"
                  color="nocolor"
                />
              </div>
              <div>
                <Button
                  icon={<Pencil size={15} />}
                  onClick={handleReceivedRO}
                  size="sm"
                  label="Edit"
                  className="text-xs font-semibold"
                  color="nocolor"
                />
              </div>

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
        children={
          <PDFViewer width="100%" height="100%">
            <RequestOrderPDF data={pdfData ?? null} />
          </PDFViewer>
        }
      />
    </div>
  );
};

export default ViewRequestModal;
