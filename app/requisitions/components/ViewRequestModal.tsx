import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayRequestItems,
  DisplayRequestOrderDto,
} from "@/dtos/request.dto";
import { Request, RequestItems } from "@/types/request";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { Check, Clock, Download, Printer } from "lucide-react";
import React, { useRef } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface ViewRequestModalProps {
  selectedReq: DisplayRequestOrderDto | null;
}
const ViewRequestModal: React.FC<ViewRequestModalProps> = ({ selectedReq }) => {
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
  const column: Column<DisplayRequestItems>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { name: "Name", key: "itemName" },
    { name: "Unit", key: "itemUnit" },
    { name: "Request Qty", key: "reqItemQuantity" },
    { name: "Delivered Qty", key: "reqItemTransfer" },
    { name: "Remarks", key: "reqItemRemarks" },
    {
      name: "Received",
      key: "reqItemReceived",
      editable: selectedReq?.requestStatus !== "received",
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
      return true;
    } catch (e) {
      toast.error("Failed to update Inventory.");
      return false;
    }
  };
  return (
    <div className="flex-col">
      <div className="p-4">
        <Table
          isRounded={false}
          updateData={handleDataUpdate}
          columns={column}
          data={itemResponse.data}
          loading={loading}
        />
      </div>
      <div className="border-t-1 border-gray-300 flex justify-between p-4 gap-4 items-center ">
        <span className="flex items-center">
          <Clock size={15} />{" "}
          <span className="text-xs ml-2">
            {" "}
            Created: {formatDateToWords(
              selectedReq?.requestCreatedAt ?? ""
            )}{" "}
          </span>
        </span>
        <div className="flex gap-2">
          <div>
            <Button
              icon={<Download size={15} />}
              onClick={handleReceivedRO}
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
              icon={<Check size={15} />}
              onClick={handleReceivedRO}
              size="sm"
              label="Received"
              className="text-xs font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewRequestModal;
