import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Table, { Column } from "@/components/shared/Table";
import { DisplayPOItemsSupplier } from "@/dtos/purchase.dto";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { formatPeso } from "@/utils/formatPeso";
import {
  Package,
  Edit,
  PrinterIcon,
  Download,
  Check,
  Send,
  ChevronUp,
  ChevronDown,
  Clock,
  PackageCheck,
  PackageCheckIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const columns: Column<PurchaseOrderItems>[] = [
  { name: "Item Name", key: "itemName" },
  { name: "Price", key: "unitPrice" },
  { name: "Ordered Qty", key: "poItemOrderedQty" },
  {
    name: "Received Qty",
    key: "poItemReceivedQty",
    editable: true,
    inputType: "number",
  },
  {
    name: "Supplier Price",
    key: "supplierPrice",
    editable: true,
    inputType: "number",
  },
  {
    name: "Total",
    key: "total",
    selector: (row) => row.poItemOrderedQty * row.unitPrice,
  },
];

interface ReceivedPOViewProps {
  data: DisplayPOItemsSupplier[];
  onReceivePO: (data: DisplayPOItemsSupplier[]) => Promise<boolean>;
}

const ReceivedPOView: React.FC<ReceivedPOViewProps> = ({
  data,
  onReceivePO,
}) => {
  const [supplierData, setSupplierData] =
    useState<DisplayPOItemsSupplier[]>(data);
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);

  const handleReceivePO = async () => {
    const success = await onReceivePO(supplierData);
    if (success) {
      alert("PO received!");
    }
  };
  const updateSupplierItems = (
    suppId: number,
    newItems: PurchaseOrderItems[]
  ) => {
    setSupplierData((prev) =>
      prev.map((supplier) =>
        supplier.suppId === suppId ? { ...supplier, items: newItems } : supplier
      )
    );
  };

  useEffect(() => {
    if (data && data.length > 0) {
      setSupplierData(data);
    }
  }, [data]);
  // ✅ Auto-fill for one supplier (one row)
  const handleAutoFill = (suppId: number, rowIndex: number) => {
    setSupplierData((prev) =>
      prev.map((supplier) => {
        if (supplier.suppId !== suppId) return supplier;
        const newItems = [...supplier.items];
        const updatedRow = { ...newItems[rowIndex] };
        updatedRow.poItemReceivedQty = updatedRow.poItemOrderedQty;
        newItems[rowIndex] = updatedRow;
        return { ...supplier, items: newItems };
      })
    );
  };

  // ✅ Auto-fill all rows for one supplier
  const handleAutoFillAll = (suppId: number) => {
    setSupplierData((prev) =>
      prev.map((supplier) =>
        supplier.suppId === suppId
          ? {
              ...supplier,
              items: supplier.items.map((item) => ({
                ...item,
                poItemReceivedQty: item.poItemOrderedQty,
              })),
            }
          : supplier
      )
    );
  };

  const handleSendBySupplier = async (items: PurchaseOrderItems[]) => {
    console.log("Send to supplier:", items);
  };

  return (
    <div className="bg-white">
      <div className="text-center mt-4 mb-2">
        <p className="text-gray-700 font-medium">
          Review PO and send to suppliers
        </p>
        <p className="text-gray-500 text-sm">
          Review your purchase order and send it to the selected suppliers.
        </p>
      </div>

      <div className="flex flex-col p-4">
        <h3 className="font-semibold text-gray-800 mb-3 text-lg">
          Order Items by Supplier
        </h3>

        <div className="space-y-4">
          {supplierData.map((supplier) => {
            const isSupplierItemsSent = supplier.items.every(
              (item) => item.poItemStatus === "sent"
            );

            const isExpanded = expandedSupplier === supplier.suppId;

            return (
              <div
                key={supplier.suppId}
                className="border border-gray-300 rounded-lg overflow-visible"
              >
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 cursor-pointer hover:from-gray-100 transition overflow-visible">
                  <div className="flex justify-between items-center overflow-visible">
                    <div className="flex items-center gap-2">
                      <Package className="text-primary-1" size={24} />
                      <div className="flex flex-col items-start gap-1">
                        <h1 className="font-semibold text-sm">
                          {supplier.suppName}
                        </h1>
                        <div className="flex text-xs text-gray-600 gap-4">
                          {supplier.suppAddress && (
                            <span>Location: {supplier.suppAddress}</span>
                          )}
                          {supplier.suppEmail && (
                            <span>Email: {supplier.suppEmail}</span>
                          )}
                          {supplier.suppPhone && (
                            <span>Phone: {supplier.suppPhone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <div className=" bg-white border-gray-200">
                          <div className="flex">
                            <div>
                              {" "}
                              <Button
                                isRounded={false}
                                size="xs"
                                color="nocolor"
                                label="Edit"
                                icon={<Edit size={15} />}
                                className="font-semibold text-gray-700 text-xs"
                                onClick={function (): void {
                                  throw new Error("Function not implemented.");
                                }}
                              />
                            </div>
                            <div>
                              {" "}
                              <Button
                                isRounded={false}
                                size="xs"
                                color="nocolor"
                                label="Print"
                                icon={
                                  <PrinterIcon
                                    size={15}
                                    className="text-gray-700"
                                  />
                                }
                                className="font-semibold text-gray-700 text-xs"
                                onClick={function (): void {
                                  throw new Error("Function not implemented.");
                                }}
                              />
                            </div>
                            <div>
                              <Button
                                isRounded={false}
                                size="xs"
                                color="nocolor"
                                label="Download PDF"
                                icon={
                                  <Download
                                    size={15}
                                    className="text-gray-700"
                                  />
                                }
                                className="font-semibold text-gray-700 text-xs"
                                onClick={function (): void {
                                  throw new Error("Function not implemented.");
                                }}
                              />
                            </div>
                            {isSupplierItemsSent ? (
                              <div>
                                <Button
                                  isRounded={false}
                                  disabled
                                  size="xs"
                                  color="success"
                                  label="Sent"
                                  icon={<Check size={15} />}
                                  className="font-semibold"
                                  onClick={function (): void {
                                    throw new Error(
                                      "Function not implemented."
                                    );
                                  }}
                                />
                              </div>
                            ) : (
                              <div>
                                {" "}
                                <Button
                                  isRounded={false}
                                  size="xs"
                                  onClick={() =>
                                    handleSendBySupplier(supplier.items)
                                  }
                                  color="nocolor"
                                  label="Receive"
                                  icon={
                                    <PackageCheck
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
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-xs">
                          {supplier.items.length} item(s)
                        </span>
                        <p className="font-bold text-primary-1 text-sm">
                          {formatPeso(
                            supplier.items.reduce((total, item) => {
                              const price = Number(item.unitPrice) || 0;
                              const qty = Number(item.poItemOrderedQty) || 0;
                              return total + price * qty;
                            }, 0)
                          )}
                        </p>
                      </div>

                      <div
                        onClick={() =>
                          setExpandedSupplier(
                            isExpanded ? null : supplier.suppId
                          )
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <Table
                      textSize="xs"
                      columns={columns}
                      data={supplier.items}
                      isRounded={false}
                      showActions
                      updateData={(newData) =>
                        updateSupplierItems(supplier.suppId, newData)
                      }
                      renderTopActions={
                        <Button
                          color="primary"
                          size="xs"
                          onClick={() => handleAutoFillAll(supplier.suppId)}
                          label="Auto-Fill All"
                          icon={<PackageCheck size={15} />}
                          className="font-semibold text-white text-xs"
                        />
                      }
                      renderActions={(row, rowIndex) => (
                        <IconButton
                          icon={<PackageCheck size={18} />}
                          onClick={() => handleAutoFill(row.suppId, rowIndex)}
                          label="Auto-Fill Received Qty"
                          bg="primary"
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t  border-gray-300  flex justify-between pl-4 pr-4 pt-4 pb-4 gap-4 items-center">
        <span className="flex items-center">
          <Clock size={15} /> <span className="text-xs ml-2"> Created: {}</span>
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
                handleReceivePO();
              }}
              label="Received PO"
              icon={<PackageCheckIcon size={15} />}
              className="font-semibold  text-xs px-2 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivedPOView;
