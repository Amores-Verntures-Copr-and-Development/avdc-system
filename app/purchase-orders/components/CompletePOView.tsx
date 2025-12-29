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
  Package,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AddItemToRequestModal from "./_components/AddItemToRequestModal";
import Popup from "@/components/shared/PopupModal";
import AddItemToRequestFromPOModal, {
  POAddToRequestItemForm,
} from "./_components/AddItemToRequestFromPOModal";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
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
    items: RequestItemsCombine[]
  ) => Promise<boolean>;
  onMarkDelivered: (request: Request[]) => Promise<boolean>;
  onCompleteRequest: (po: PurchaseOrders) => Promise<boolean>;
  onClose: () => void;
  mutate: () => void;
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request">
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
    null
  );
  const [isShowDeliverConfirm, setIsShowDeliverConfirm] = useState(false);
  const [deliverRequestData, setDeliverRequestData] =
    useState<DisplayRequisitionWithItems | null>(null);
  const [requestItems, setRequestItems] =
    useState<DisplayRequisitionWithItems[]>(data);

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isShowAddItemRequest, setIsShowAddItemRequest] =
    useState<boolean>(false);
  const [isShowAddItemFromPO, setIsShowAddItemFromPO] =
    useState<boolean>(false);
  const [selectedRequestNo, setSelectedRequestNo] =
    useState<DisplayRequisitionWithItems | null>(null);
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
        const status = data.find(
          (req) => req.requestId === row.requestId
        )?.requestStatus;
        return (
          !["delivered", "completed", "received", "not_ordered"].includes(
            status ?? ""
          ) && row.reqItemStatus !== "not_ordered"
        );
      },
      inputType: "number",
    },
    {
      name: "Total",
      key: "total",

      selector: (row) => formatPeso(row.reqItemQuantity * row.itemPrice),
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
        const status = data.find(
          (req) => req.requestId === row.requestId
        )?.requestStatus;
        return !["delivered", "completed", "received"].includes(status ?? "");
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
    {
      name: "Remarks",
      key: "reqItemRemarks",
      editable: (row) => {
        const status = data.find(
          (req) => req.requestId === row.requestId
        )?.requestStatus;
        return (
          !["delivered", "completed", "received"].includes(status ?? "") &&
          row.reqItemStatus === "not_ordered"
        );
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
    let insufficientCount = 0;

    // Find current items
    const currentItems = requestItems.find(
      (items) => items.requestNo === requestNo
    );

    currentItems?.requestItemsData?.forEach((item) => {
      // Only count items that are not "not_ordered"
      if (
        item.reqItemStatus !== "not_ordered" &&
        item.reqItemQuantity > (item.stockRoomQty || 0)
      ) {
        insufficientCount++;
      }
    });

    // Update state
    setRequestItems((prev) =>
      prev.map((items) =>
        items.requestNo === requestNo
          ? {
              ...items,
              requestItemsData: items.requestItemsData?.map((item) => {
                // Skip "not_ordered" items
                if (item.reqItemStatus === "not_ordered") return item;

                // If quantity exceeds stock, don't fulfill
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

    if (insufficientCount > 0) {
      toast.error(
        `${insufficientCount} items are not fulfilled due to out of stock!`
      );
    }
  };

  const handleMarkPaid = async (data: DisplayRequisitionWithItems) => {
    const newRequestItems: RequestItems[] = data.requestItemsData.map(
      (items) => ({
        ...items,
      })
    );
    console.log({ newRequestItems });

    const hasNoFulFillQty = newRequestItems.some(
      (item) =>
        item.reqItemStatus !== "not_ordered" &&
        Number(item.reqItemTransfer) === 0
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

      if (onMarkDelivered) {
        const success = await onMarkDelivered(newRequest);
        if (success) {
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
      console.log({ data });
      const res = await fetch(
        `/api/purchase-order/po-request-order/requestId/${data.poId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
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

  return (
    <div className="gap-5 bg-white h-full flex flex-col overflow-hidden">
      <div className="flex p-2  flex-col h-full w-full overflow-y-auto">
        <div className="p-4 border-b-1 border-gray-200">
          <div className="flex justify-between  items-center">
            <div className="flex flex-col">
              <h1 className="text-xs xl:text-md font-semibold">
                Requisition Fulfillment
              </h1>
              <p className="text-[9px] xl:text-xs text-gray-500 mt-1">
                Review and fulfill requisition requests
              </p>
            </div>
            <div className="flex gap-2">
              <div className="self-center">
                <Button
                  size="sm"
                  label="View All PO"
                  onClick={() => {
                    setShowAllItems("all");
                  }}
                />
              </div>
              <div className="self-center">
                <Button
                  size="sm"
                  label="View PO Request"
                  onClick={() => {
                    setShowAllItems("request");
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col p-4 gap-4 overflow-y-auto">
          {requestItems.map((reqData) => {
            const { label, bg, color, border } = getRequestStatusOption(
              reqData.requestStatus
            );
            const totalRequestItemPrice = reqData.requestItemsData.reduce(
              (total, item) => {
                const quantity = Number(item.reqItemQuantity || 1);
                const price = Number(item.itemPrice || 0);
                return total + quantity * price;
              },
              0
            );
            return (
              <div
                className="flex flex-col shadow w-full border-1 border-gray-200 cursor-pointer"
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
                    <span className="text-[9px] xl:text-xs text-gray-500">
                      {reqData.requestItemsData.length} item(s)
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
                  <div className="overflow-visible">
                    <Table
                      localSearch
                      uniqueIdKey="reqItemId"
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
                              // setIsProcessing(reqData.requestNo);
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
                        color="secondary"
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
                        color="secondary"
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
                        color="tertiary"
                        size="xs"
                        onClick={() => {
                          setIsShowAddItemRequest(true);
                          setSelectedRequestNo(reqData);
                        }}
                        label="Add Item in Request"
                        icon={<Package size={14} className="text-white-700" />}
                        className="font-semibold text-gray-700 text-xs px-2 py-2"
                      />
                    </div>
                    <div>
                      <Button
                        color="warning"
                        size="xs"
                        onClick={() => {
                          setIsShowAddItemFromPO(true);
                          setSelectedRequestNo(reqData);
                        }}
                        label="Add Item from PO"
                        icon={<Package size={14} className="text-white-700" />}
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
                          const hasNoFulFillQty = reqData.requestItemsData.some(
                            (item) =>
                              item.reqItemStatus !== "not_ordered" &&
                              Number(item.reqItemTransfer) === 0
                          );
                          console.log({ hasNoFulFillQty });
                          if (hasNoFulFillQty) {
                            toast.error(
                              "Failed to deliver. Cannot deliver 0 quantity"
                            );
                            return;
                          }
                          setIsShowDeliverConfirm(true);
                          setDeliverRequestData(reqData);
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
              color="secondary"
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
        <AddItemToRequestModal data={selectedRequestNo} />
      </Popup>
      <ConfirmationModal
        onConfirm={() => {
          if (deliverRequestData) {
            handleMarkPaid(deliverRequestData);
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
