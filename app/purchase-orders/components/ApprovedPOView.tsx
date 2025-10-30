import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayPOItemsSupplier,
  DisplayPurchaseOrderItemsDto,
} from "@/dtos/purchase.dto";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { formatPeso } from "@/utils/formatPeso";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit,
  Loader2,
  Package,
  PrinterIcon,
  Send,
} from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface ApprovedPOViewProps {
  data: DisplayPOItemsSupplier[];
  onSendPO: (data: DisplayPOItemsSupplier[]) => Promise<boolean>;
  onSendPOItem: (data: PurchaseOrderItems[]) => Promise<boolean>;
  loading: boolean;
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
  },
  {
    name: "Quantity",
    key: "poItemOrderedQty",
  },
  {
    name: "Total",
    key: "total",
    selector: (row: PurchaseOrderItems) => row.poItemOrderedQty * row.unitPrice,
  },
];
const ApprovedPOView: React.FC<ApprovedPOViewProps> = ({
  data,
  onSendPO,
  onSendPOItem,
  loading,
}) => {
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);
  const [sendingSupplier, setSendingSupplier] = useState<number | null>(null);
  const handleSendBySupplier = async (
    poItems: PurchaseOrderItems[],
    suppId: number
  ) => {
    setSendingSupplier(suppId);
    const supplierName = data.find((req) => req.suppId === suppId)?.suppName;
    const success = await onSendPOItem(poItems);
    if (success) {
      toast.success(`Items for ${supplierName}  sent!`);
    }
    setSendingSupplier(null);
  };
  const handleSendToSupliers = async (data: DisplayPOItemsSupplier[]) => {
    const success = await onSendPO(data);
    if (success) {
      toast.success("Purchase Order successfully sent!");
    }
  };
  return (
    <div className="gap-5 bg-white h-full flex flex-col overflow-hidden">
      <div className="flex p-2  flex-col h-full w-full overflow-hidden">
        <div className="text-center mt-4 mb-2">
          <p className="text-gray-700 font-medium">
            Review PO and send to suppliers
          </p>
          <p className="text-gray-500 text-sm">
            Review your purchase order and send it to the selected suppliers.
          </p>
        </div>
        {/* Table */}
        <div className="flex flex-1 flex-col p-4 overflow-hidden">
          <h3 className="font-semibold text-gray-800 mb-3 text-lg">
            Order Items by Supplier
          </h3>
          <div className="flex p-2  flex-col h-full w-full overflow-y-auto gap-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary-1" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              data.map((data) => {
                return (
                  <div
                    className="border border-gray-300 rounded-lg overflow-hidden"
                    key={data.suppId}
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 cursor-pointer hover:from-gray-100 hover:to-gray-150 transition">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Package className="text-primary-1" size={24} />
                          <div className="flex flex-col items-start gap-1">
                            <h1 className="font-semibold text-sm">
                              {data.suppName}
                            </h1>
                            <div className="flex text-xs text-gray-600 gap-4">
                              {data.suppAddress && (
                                <span>Location: {data.suppAddress}</span>
                              )}
                              {data.suppEmail && (
                                <span>Email: {data.suppEmail}</span>
                              )}
                              {data.suppPhone && (
                                <span>Phone: {data.suppPhone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <div className=" bg-white border-gray-200 border-0 flex">
                              <div>
                                {" "}
                                <Button
                                  isRounded={false}
                                  size="xs"
                                  onClick={function (): void {
                                    throw new Error(
                                      "Function not implemented."
                                    );
                                  }}
                                  color="nocolor"
                                  label="Edit"
                                  icon={<Edit size={15} />}
                                  className="font-semibold text-gray-700 text-xs"
                                />
                              </div>
                              <div>
                                <Button
                                  isRounded={false}
                                  size="xs"
                                  onClick={function (): void {
                                    throw new Error(
                                      "Function not implemented."
                                    );
                                  }}
                                  color="nocolor"
                                  label="Print"
                                  icon={
                                    <PrinterIcon
                                      size={15}
                                      className="text-gray-700"
                                    />
                                  }
                                  className="font-semibold text-gray-700 text-xs"
                                />
                              </div>
                              <div>
                                <Button
                                  isRounded={false}
                                  size="xs"
                                  onClick={function (): void {
                                    throw new Error(
                                      "Function not implemented."
                                    );
                                  }}
                                  color="nocolor"
                                  label="Download PDF"
                                  icon={
                                    <Download
                                      size={15}
                                      className="text-gray-700"
                                    />
                                  }
                                  className="font-semibold text-gray-700 text-xs"
                                />
                              </div>
                              {data.items.every(
                                (i) => i.poItemStatus === "sent"
                              ) ? (
                                <>
                                  <div>
                                    {" "}
                                    <Button
                                      isRounded={false}
                                      disabled={true}
                                      size="xs"
                                      onClick={function (): void {
                                        throw new Error(
                                          "Function not implemented."
                                        );
                                      }}
                                      color="success"
                                      label="Sent"
                                      icon={<Check size={15} />}
                                      className="font-semibold"
                                    />
                                  </div>
                                </>
                              ) : (
                                <div>
                                  {" "}
                                  <Button
                                    loading={sendingSupplier === data.suppId}
                                    isRounded={false}
                                    size="xs"
                                    onClick={() =>
                                      handleSendBySupplier(
                                        data.items,
                                        data.suppId
                                      )
                                    }
                                    color="nocolor"
                                    label="Send"
                                    icon={
                                      <Send
                                        size={15}
                                        className="text-primary-1 "
                                      />
                                    }
                                    className="font-semibold"
                                  />
                                </div>
                              )}
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
                                }, 0)
                              )}
                            </p>
                          </div>
                          <div
                            onClick={() =>
                              setExpandedSupplier(
                                expandedSupplier === data.suppId
                                  ? null
                                  : data.suppId
                              )
                            }
                          >
                            {expandedSupplier === data.suppId ? (
                              <ChevronUp size={20} />
                            ) : (
                              <ChevronDown size={20} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {expandedSupplier === data.suppId && (
                      <div className="overflow-x-auto">
                        <Table
                          textSize="xs"
                          columns={columns}
                          data={data.items}
                          isRounded={false}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="border-t  border-gray-300  flex justify-between pl-4 pr-4 pt-4 pb-4 gap-4 items-center">
          <span className="flex items-center">
            <Clock size={15} />{" "}
            <span className="text-xs ml-2"> Created: {}</span>
          </span>
          <div className="flex gap-3">
            <div>
              <Button
                color="nocolor"
                size="sm"
                onClick={function (): void {
                  throw new Error("Function not implemented.");
                }}
                label="Print"
                icon={<PrinterIcon size={15} />}
                className="font-semibold text-gray-700 text-xs px-2 py-2"
              />
            </div>
            <div className="">
              <Button
                color="nocolor"
                size="sm"
                onClick={function (): void {
                  throw new Error("Function not implemented.");
                }}
                label="Download PDF"
                icon={<Edit size={15} className="text-gray-700" />}
                className="font-semibold text-gray-700 text-xs px-2 py-2"
              />
            </div>
            <div>
              <Button
                size="sm"
                onClick={function (): void {
                  handleSendToSupliers(data);
                }}
                label="Send to Suppliers"
                icon={<Send size={15} />}
                className="font-semibold  text-xs px-2 py-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovedPOView;
