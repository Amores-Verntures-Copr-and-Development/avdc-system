import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayRequisitionWithItems,
  RequestItemsCombine,
} from "@/dtos/purchase.dto";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { getRequestStatusOption } from "@/utils/requestOrderUtils";

import {
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  LogOut,
  PrinterIcon,
} from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import { getStatusOption } from "./CompletePOView";

interface ShowPOByRequestProps {
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request" | "supplier">
  >;
  data: PurchaseOrders | null;
}

const ShowPOByRequest = ({ setShowAllItems, data }: ShowPOByRequestProps) => {
  const [isRequestExpanded, setIsRequestExpanded] = useState<string | null>(
    null,
  );
  const { data: itemResponse = { data: [] } } = useSWR<{
    data: DisplayRequisitionWithItems[];
  }>(`/api/purchase-order/po-request-order/${data?.poNumber}`, fetcher);
  const columns: Column<RequestItemsCombine>[] = [
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
      name: "Unit",
      key: "itemUnit",
    },
    {
      name: "Request Qty",
      key: "reqItemQuantity",
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
              ) * Number(row.unitPrice),
            ),
    },
    {
      name: "Remarks",
      key: "reqItemRemarks",
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

  const totalAllRequestItemPrice = itemResponse.data.reduce((sum, req) => {
    const totalRequestItemPrice = req.requestItemsData
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
        const price = Number(item.unitPrice || 0);
        return total + quantity * price;
      }, 0);

    return sum + totalRequestItemPrice;
  }, 0);
  return (
    <div className="flex flex-col h-full p-4 bg-white overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-semibold">PO Items by Request</h1>
        <div className="flex ">
          <div>
            <Button
              isRounded={false}
              label="Print"
              size="sm"
              onClick={() => {
                setShowAllItems("status");
              }}
              color="neutral"
              icon={PrinterIcon}
            />
          </div>
          <div>
            <Button
              isRounded={false}
              label="Download PDF"
              size="sm"
              onClick={() => {
                setShowAllItems("status");
              }}
              color="neutral"
              icon={Download}
            />
          </div>
          <div>
            <Button
              isRounded={false}
              label="Back"
              size="sm"
              onClick={() => {
                setShowAllItems("status");
              }}
              color="neutral"
              icon={LogOut}
            />
          </div>
        </div>
      </div>

      {/* Scrollable area for items */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col p-4 gap-4">
          {itemResponse.data.map((reqData) => {
            const { label, bg, color, border } = getRequestStatusOption(
              reqData.requestStatus ?? "",
            );
            const totalRequestItemPrice = reqData.requestItemsData.reduce(
              (total, item) => {
                const quantity = Number(item.reqItemQuantity || 1);
                const price = Number(item.unitPrice || 0);
                return total + quantity * price;
              },
              0,
            );
            return (
              <div
                className="flex flex-col shadow w-full border-1 border-gray-200 cursor-pointer"
                key={reqData.requestId}
                onClick={() =>
                  setIsRequestExpanded(
                    isRequestExpanded === reqData.requestNo
                      ? null
                      : reqData.requestNo,
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
                          : reqData.requestNo,
                      )
                    }
                    className="cursor-pointer"
                  >
                    <div className="flex gap-2 items-center">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-xs font-medium ${bg} py-1 px-1 rounded-2xl ${color} ${border}`}
                        >
                          {label}
                        </span>
                        <span className="text-xs">
                          Total:
                          <span className="font-semibold">
                            {formatPeso(totalRequestItemPrice)}
                          </span>
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
                          reqData.requestStatus ?? "",
                        )
                      }
                      data={reqData.requestItemsData}
                      isRounded={false}
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
                        color="secondary"
                        size="xs"
                        onClick={() => {
                          console.log("Print request:", reqData.requestNo);
                        }}
                        label="Print"
                        icon={PrinterIcon}
                        className="font-semibold text-gray-700 text-xs px-2 py-2"
                      />
                    </div>
                    <div>
                      <Button
                        color="secondary"
                        size="xs"
                        onClick={() => {
                          console.log("Download PDF:", reqData.requestNo);
                        }}
                        label="Download PDF"
                        icon={FileText}
                        className="font-semibold text-gray-700 text-xs px-2 py-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total section - positioned at bottom right */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="flex items-center text-[9px] md:text-xs">
            <Clock size={15} />
            <span className="ml-2">
              Created: {formatDateToWords(data?.poCreatedAt ?? "")}
            </span>
          </span>
          <div className="text-right">
            <span className="text-sm">
              Total Purchase:
              <span className="font-semibold ml-1">
                {formatPeso(totalAllRequestItemPrice ?? 0)}
              </span>
            </span>
            <div className="text-[10px] text-gray-500 mt-1">
              {itemResponse.data.length} request(s)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowPOByRequest;
