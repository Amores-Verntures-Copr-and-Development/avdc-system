import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayRequisitionWithItems,
  RequestItemsCombine,
} from "@/dtos/purchase.dto";
import { PurchaseOrders } from "@/types/purchaseOrders";

import { Request, RequestItems } from "@/types/request";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { getRequestStatusFormat } from "@/utils/formatRequestStatus";
import {
  PrinterIcon,
  Edit,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  FileText,
  Clock,
  PackageCheckIcon,
  Check,
  Truck,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface CompletePOViewProps {
  data: DisplayRequisitionWithItems[];
  poData: PurchaseOrders | null;
  isLoading?: boolean;
  onFulfillRequest?: (
    requestId: string,
    items: RequestItemsCombine[]
  ) => Promise<boolean>;
  onMarkDelivered: (request: Request[]) => Promise<boolean>;
  onCompleteRequest: (po: PurchaseOrders) => Promise<boolean>;
  onClose: () => void;
  mutate: () => void;
}

const CompletePOView: React.FC<CompletePOViewProps> = ({
  data,
  onMarkDelivered,
  poData,
  onCompleteRequest,
  onClose,
  mutate,
}) => {
  const [isRequestExpanded, setIsRequestExpanded] = useState<string | null>(
    null
  );
  const [requestItems, setRequestItems] =
    useState<DisplayRequisitionWithItems[]>(data);

  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  console.log("RequestItems: ", data);
  const columns: Column<RequestItemsCombine>[] = [
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
        const status = data.find(
          (req) => req.requestId === row.requestId
        )?.requestStatus;
        return !["delivered", "completed", "received"].includes(status ?? "");
      },
      inputType: "number",
    },
    {
      name: "Total",
      key: "total",
    },
    {
      name: "Remarks",
      key: "reqItemRemarks",
      editable: (row) => {
        const status = data.find(
          (req) => req.requestId === row.requestId
        )?.requestStatus;
        return !["delivered", "completed", "received"].includes(status ?? "");
      },
      inputType: "text",
    },
  ];
  const handleDataChange = (
    requestNo: string,
    updatedItems: RequestItemsCombine[]
  ) => {
    setRequestItems((prev) =>
      prev.map((items) =>
        items.requestNo === requestNo
          ? { ...items, requestItemsData: updatedItems }
          : items
      )
    );
  };
  useEffect(() => {
    if (data && data.length > 0) {
      setRequestItems(data);
    }
  }, [data]);

  const handleAutoFillAll = (requestNo: string) => {
    let inssuficientCount = 0;

    // First, calculate the count
    const currentItems = requestItems.find(
      (items) => items.requestNo === requestNo
    );
    currentItems?.requestItemsData?.forEach((item) => {
      if (item.reqItemQuantity > (item.stockRoomQty || 0)) {
        inssuficientCount++;
      }
    });

    // Then update state
    setRequestItems((prev) =>
      prev.map((items) =>
        items.requestNo === requestNo
          ? {
              ...items,
              requestItemsData: items.requestItemsData?.map((item) => {
                if (item.reqItemQuantity > (item.stockRoomQty || 0)) {
                  return {
                    ...item,
                  };
                } else {
                  return {
                    ...item,
                    reqItemTransfer: item.reqItemQuantity,
                  };
                }
              }),
            }
          : items
      )
    );

    if (inssuficientCount > 0) {
      toast.error(
        `${inssuficientCount} items are not fulfilled due to out of stock!`
      );
    }
  };
  const handleMarkPaid = async (data: DisplayRequisitionWithItems) => {
    const newRequestItems: RequestItems[] = data.requestItemsData.map(
      (items) => ({
        ...items,
      })
    );
    const newRequest: Request[] = [
      {
        ...data,
        requestItems: newRequestItems,
      },
    ];

    if (onMarkDelivered) {
      const success = await onMarkDelivered(newRequest);
      if (success) {
        mutate();
      }
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

  return (
    <div className="gap-5 bg-white h-full flex flex-col overflow-hidden">
      <div className="flex p-2  flex-col h-full w-full overflow-y-auto">
        <div className="p-4 border-b-1 border-gray-200">
          <h1 className="text-xs md:text-md font-semibold">
            Requisition Fulfillment
          </h1>
          <p className="text-[9px] xl:text-xs text-gray-500 mt-1">
            Review and fulfill requisition requests
          </p>
        </div>
        <div className="flex flex-col p-4 gap-4 overflow-y-auto">
          {requestItems.map((reqData) => {
            const { textClass, bgClass, status, borderClass } =
              getRequestStatusFormat(reqData.requestStatus);
            return (
              <div
                className="flex flex-col shadow w-full border-1 border-gray-200 cursor-pointer "
                key={reqData.requestId}
                onClick={() =>
                  setIsRequestExpanded(
                    isRequestExpanded === reqData.requestNo
                      ? null
                      : reqData.requestNo
                  )
                }
              >
                <div className="flex items-center justify-between p-2">
                  <div className="flex flex-col border-gray-200">
                    <h1 className="text-xs xl:text-sm font-semibold">
                      {reqData.requestNo}
                    </h1>
                    <span className="text-[9px] xl:text-xs text-gray-500">
                      {reqData.storeName}
                    </span>
                  </div>
                  <div
                    onClick={() =>
                      setIsRequestExpanded(
                        isRequestExpanded === reqData.requestNo
                          ? null
                          : reqData.requestNo
                      )
                    }
                    className="cursor-pointer"
                  >
                    <div className="flex gap-2 items-center">
                      <div>
                        <span
                          className={`text-xs font-medium ${bgClass} py-1 px-1 rounded-2xl ${textClass} ${borderClass}`}
                        >
                          {status}
                        </span>
                      </div>
                      {isRequestExpanded === reqData.requestNo ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </div>
                  </div>
                </div>
                {isRequestExpanded === reqData.requestNo && (
                  <div>
                    <Table
                      columns={columns}
                      showActions={
                        !["delivered", "completed", "received"].includes(
                          reqData.requestStatus ?? ""
                        )
                      }
                      renderActions={(row) => (
                        <div>
                          <IconButton
                            onClick={function (): void {
                              setIsProcessing(reqData.requestNo);
                            }}
                            label={`Fulfill ${row.itemName}`}
                            icon={<Check size={18} />}
                            bg={""}
                          />
                        </div>
                      )}
                      data={reqData.requestItemsData}
                      isRounded={false}
                      updateData={(updatedItems) =>
                        handleDataChange(reqData.requestNo, updatedItems)
                      }
                    />
                  </div>
                )}
                <div className="flex border-t-1 p-2 justify-between border-gray-200 items-center">
                  <span className="text-[9px] md:text-xs">
                    Created: {formatDateToWords(reqData.poCreatedAt)}
                  </span>
                  <div className="flex gap-3">
                    <div>
                      <Button
                        color="nocolor"
                        size="xs"
                        onClick={() => {
                          console.log("Print request:", reqData.requestNo);
                        }}
                        label="Print"
                        icon={<PrinterIcon size={14} />}
                        className="font-semibold text-gray-700 text-xs px-2 py-2"
                      />
                    </div>
                    <div>
                      <Button
                        color="nocolor"
                        size="xs"
                        onClick={() => {
                          console.log("Download PDF:", reqData.requestNo);
                        }}
                        label="Download PDF"
                        icon={<FileText size={14} className="text-gray-700" />}
                        className="font-semibold text-gray-700 text-xs px-2 py-2"
                      />
                    </div>
                    <div>
                      <Button
                        size="xs"
                        onClick={() => {
                          handleAutoFillAll(reqData.requestNo);
                        }}
                        label={
                          isProcessing === reqData.requestNo
                            ? "Processing..."
                            : `Fulfill ${reqData.requestNo}`
                        }
                        icon={<CheckCircle size={14} />}
                        className="font-semibold text-xs px-2 py-2"
                        disabled={
                          isProcessing === reqData.requestNo ||
                          reqData.requestStatus === "delivered" ||
                          reqData.requestStatus === "received" ||
                          reqData.requestStatus === "completed"
                        }
                        color="success"
                      />
                    </div>
                    <div>
                      <Button
                        size="xs"
                        onClick={() => {
                          handleMarkPaid(reqData);
                        }}
                        label={
                          isProcessing === reqData.requestNo
                            ? "Processing..."
                            : `Mark as Delivered`
                        }
                        icon={<Truck size={14} />}
                        className="font-semibold text-xs px-2 py-2"
                        disabled={
                          isProcessing === reqData.requestNo ||
                          reqData.requestStatus === "delivered" ||
                          reqData.requestStatus === "received" ||
                          reqData.requestStatus === "completed"
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t  border-gray-300  flex justify-between pl-4 pr-4 pt-4 pb-4 gap-4 items-center">
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
              color="nocolor"
              size="sm"
              onClick={function (): void {
                throw new Error("Function not implemented.");
              }}
              label="PDF"
              icon={<Edit size={15} className="text-gray-700" />}
              className="font-semibold text-gray-700 text-xs px-2 py-2"
            />
          </div>
          {poData?.poStatus !== "completed" && (
            <div>
              <Button
                size="sm"
                onClick={function (): void {
                  handleCompletePO();
                }}
                label="Complete PO"
                disabled={data.every(
                  (req) => req.requestStatus !== "completed"
                )}
                icon={<PackageCheckIcon size={15} />}
                className="font-semibold  text-xs px-2 py-2"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletePOView;
