import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";

import Table, { Column } from "@/components/shared/Table";
import {
  DeliverItemsToStore,
  DisplayPOItemsSupplier,
} from "@/dtos/purchase.dto";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";
import { formatPeso } from "@/utils/formatPeso";
import {
  Package,
  Edit,
  PrinterIcon,
  Download,
  Check,
  ChevronUp,
  ChevronDown,
  Clock,
  PackageCheck,
  PackageCheckIcon,
  X,
  Truck,
  Store,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DeliverItemStoreModal from "./_components/DeliverItemStoreModal";
import Popup from "@/components/shared/Popup";
import useSWR from "swr";
import { StoreSupplierDetails } from "./ApprovedPOView";
import { fetcher } from "@/utils/fetcher";
import StoreCardInSupplier from "./_components/StoreCardInSupplier";
import Modal from "@/components/shared/Modal";
import { Supplier } from "@/types/supplier";
import { RequestItems } from "@/types/request";

const columns: Column<PurchaseOrderItems>[] = [
  { name: "Item Name", key: "itemName" },
  { name: "Price", key: "unitPrice" },
  { name: "Ordered Qty", key: "poItemOrderedQty" },
  {
    name: "Received Qty",
    key: "poItemReceivedQty",
    editable: (row) => row.poItemStatus === "sent",
    inputType: "number",
  },
  {
    name: "Supplier Price",
    key: "supplierPrice",
    editable: (row) => row.poItemStatus === "sent",
    inputType: "number",
  },
  {
    name: "Total",
    key: "total",
    selector: (row) => row.poItemOrderedQty * row.unitPrice,
  },
  {
    name: "Status",
    key: "poItemStatus",
  },
];

const storeColumns: Column<RequestItems>[] = [
  { name: "#", key: "#", selector: (row, index) => index + 1 },
  { name: "Item Name", key: "itemName" },
  { name: "Price", key: "itemPrice" },
  { name: "Ordered Qty", key: "reqItemQuantity" },
  {
    name: "Status",
    key: "reqItemStatus",
  },
  {
    name: "Remarks",
    key: "reqItemRemarks",
  },
];

interface ReceivedPOViewProps {
  data: DisplayPOItemsSupplier[];
  onReceivePO: (data: DisplayPOItemsSupplier[]) => Promise<boolean>;
  isLoading?: boolean;
  poId: number;
  poData: PurchaseOrders | null;
  onClose: () => void;
}

interface StoreInSupplierDetails {
  data: StoreSupplierDetails;
  supplier: Supplier;
}
const ReceivedPOView: React.FC<ReceivedPOViewProps> = ({
  data,
  onReceivePO,
  isLoading,
  poId,
  poData,
  onClose,
}) => {
  const [supplierData, setSupplierData] =
    useState<DisplayPOItemsSupplier[]>(data);
  const [isView, setIsView] = useState<"all" | "store">("all");
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);
  const [isShowDeliverConfirmation, setIsShowDeliverConfirmation] =
    useState(false);
  const [showDeliverToStore, setShowDeliverToStore] =
    useState<DisplayPOItemsSupplier | null>(null);
  const [selectedStoreSupplier, setSelectedStoreSupplier] =
    useState<StoreInSupplierDetails | null>(null);
  const { data: itemResponse = { data: [] }, mutate } = useSWR<{
    data: StoreSupplierDetails[];
  }>(
    isView === "store" && expandedSupplier
      ? `/api/purchase-order/${poData?.poId}/suppliers/${expandedSupplier}`
      : null,
    fetcher,
    {
      keepPreviousData: false, // This keeps the data when the key becomes null
      revalidateOnFocus: false, // Optional: prevent refetch on window focus
    }
  );
  const handleReceivePO = async (row: DisplayPOItemsSupplier[]) => {
    const success = await onReceivePO(row);
    if (success) {
      // onClose();
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
  const handleDeliverItemStore = async (data: DeliverItemsToStore) => {
    try {
      const result = await fetch(`api/purchase-order/deliver/${data.storeId}`, {
        method: "PUT",
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
      setIsShowDeliverConfirmation(false);
      setSelectedStoreSupplier(null);
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to process deliver.");
      return false;
    }
  };
  const isAllItemsDelivered = data.flatMap((po) =>
    po.items.every((item) => item.poItemStatus === "delivered")
  );
  console.log("isAllItemsDelivered: ", isAllItemsDelivered);
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

        <div className="flex flex-1 flex-col p-4 overflow-hidden">
          <h3 className="font-semibold text-gray-800  text-lg">
            Order Items by Supplier
          </h3>

          <div className="flex p-2  flex-col h-full w-full overflow-y-auto gap-2">
            {supplierData.map((supplier) => {
              const isSupplierItemsSent = supplier.items.every(
                (item) => item.poItemStatus === "sent"
              );
              const isSupplierItemsDelivered = supplier.items.every(
                (item) => item.poItemStatus === "delivered"
              );

              const isExpanded = expandedSupplier === supplier.suppId;

              return (
                <div
                  key={supplier.suppId}
                  className="border border-gray-300 rounded-lg overflow-auto"
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
                      <div className="flex items-center">
                        <div>
                          {" "}
                          <Button
                            isRounded={false}
                            size="xs"
                            onClick={function (): void {
                              setExpandedSupplier(supplier.suppId);
                              setIsView("all");
                            }}
                            color={
                              isView === "all" &&
                              expandedSupplier === supplier.suppId
                                ? "primary"
                                : "nocolor"
                            }
                            label="All"
                            icon={<Edit size={15} />}
                            className="font-semibold text-gray-700 text-xs"
                          />
                        </div>
                        <div>
                          {" "}
                          <Button
                            isFocus
                            isRounded={false}
                            size="xs"
                            onClick={function (): void {
                              setExpandedSupplier(supplier.suppId);
                              setIsView("store");
                            }}
                            color={
                              isView === "store" &&
                              expandedSupplier === supplier.suppId
                                ? "primary"
                                : "nocolor"
                            }
                            label="Store"
                            icon={<Store size={15} />}
                            className="font-semibold text-gray-700 text-xs"
                          />
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
                                    throw new Error(
                                      "Function not implemented."
                                    );
                                  }}
                                />
                              </div>
                              <div>
                                <Button
                                  isRounded={false}
                                  size="xs"
                                  color="nocolor"
                                  label="PDF"
                                  icon={
                                    <Download
                                      size={15}
                                      className="text-gray-700"
                                    />
                                  }
                                  className="font-semibold text-gray-700 text-xs"
                                  onClick={function (): void {
                                    throw new Error(
                                      "Function not implemented."
                                    );
                                  }}
                                />
                              </div>
                              {isSupplierItemsSent ? (
                                <>
                                  <div>
                                    {" "}
                                    <div>
                                      {" "}
                                      <Button
                                        isRounded={false}
                                        size="xs"
                                        onClick={() => {
                                          handleReceivePO([supplier]);
                                        }}
                                        color="primary"
                                        label="Receive PO"
                                        icon={<Package size={15} />}
                                        className="font-semibold"
                                      />
                                    </div>
                                  </div>
                                </>
                              ) : isSupplierItemsDelivered ? (
                                <>
                                  <div>
                                    {" "}
                                    <div>
                                      {" "}
                                      <Button
                                        isRounded={false}
                                        size="xs"
                                        onClick={() => {
                                          setShowDeliverToStore(supplier);
                                        }}
                                        disabled={true}
                                        color="success"
                                        label="Delivered"
                                        icon={<Check size={15} />}
                                        className="font-semibold"
                                      />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div>
                                  {" "}
                                  <Button
                                    isRounded={false}
                                    size="xs"
                                    onClick={() =>
                                      handleSendBySupplier(supplier.items)
                                    }
                                    color="success"
                                    label="Received"
                                    disabled={true}
                                    icon={
                                      <PackageCheck
                                        size={15}
                                        className="text-black "
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
                      {selectedStoreSupplier === null ? (
                        isView === "all" ? (
                          <Table
                            textSize="xs"
                            columns={columns}
                            data={supplier.items}
                            isRounded={false}
                            showActions
                            updateData={(newData) =>
                              updateSupplierItems(supplier.suppId, newData)
                            }
                            loading={isLoading}
                            renderTopActions={
                              !isAllItemsDelivered && (
                                <Button
                                  color="primary"
                                  size="xs"
                                  onClick={() =>
                                    handleAutoFillAll(supplier.suppId)
                                  }
                                  label="Auto-Fill All"
                                  icon={<PackageCheck size={15} />}
                                  className="font-semibold text-white text-xs"
                                />
                              )
                            }
                            renderActions={(row, rowIndex) =>
                              row.poItemStatus === "sent" ? (
                                <IconButton
                                  icon={<PackageCheck size={18} />}
                                  onClick={() =>
                                    handleAutoFill(row.suppId, rowIndex)
                                  }
                                  label="Auto-Fill Received Qty"
                                  bg="primary"
                                />
                              ) : (
                                <></>
                              )
                            }
                          />
                        ) : (
                          <div className="flex flex-1 p-2 gap-4 overflow-auto-y">
                            {itemResponse.data.map((data) => (
                              <StoreCardInSupplier
                                data={data}
                                key={data.storeId}
                                onClick={(row: StoreSupplierDetails) => {
                                  console.log(row);
                                  setSelectedStoreSupplier({
                                    data: row,
                                    supplier: supplier,
                                  });
                                }}
                              />
                            ))}
                          </div>
                        )
                      ) : (
                        <Table
                          title={selectedStoreSupplier.data.storeName}
                          subtitle={`${selectedStoreSupplier.data.items.length} items`}
                          renderTopActions={
                            <div className="flex">
                              <div className="mr-50">
                                {" "}
                                <div>
                                  {" "}
                                  <Button
                                    isRounded={false}
                                    size="xs"
                                    onClick={() => {
                                      // setShowDeliverToStore(supplier);
                                      setIsShowDeliverConfirmation(true);
                                    }}
                                    color="success"
                                    label="Deliver to Store"
                                    icon={<Package size={15} />}
                                    className="font-semibold"
                                  />
                                </div>
                              </div>
                              <div>
                                {" "}
                                <button
                                  onClick={() => {
                                    setSelectedStoreSupplier(null);
                                  }}
                                  className="rounded-full hover:bg-gray-500 py-2 px-2"
                                >
                                  <X className="text-black" size={15} />
                                </button>
                              </div>
                            </div>
                          }
                          columns={storeColumns}
                          data={selectedStoreSupplier.data.items}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex border-t-1 p-2 justify-between border-gray-200 items-center">
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
                label={"Download PDF"}
                icon={<Edit size={15} className="text-gray-700" />}
                className="font-semibold text-gray-700 text-xs px-2 py-2"
              />
            </div>
          </div>
        </div>
      </div>
      <Popup
        title="Deliver Item"
        background="transaparent"
        // subtitle="Select store to deliver item"
        isOpen={showDeliverToStore !== null}
        onClose={function (): void {
          setShowDeliverToStore(null);
        }}
      >
        {" "}
        <DeliverItemStoreModal
          data={showDeliverToStore}
          onSubmit={handleDeliverItemStore}
          poId={poId}
          onCancel={() => {
            setShowDeliverToStore(null);
          }}
        />
      </Popup>
      <Modal
        leadingIcon={Truck} // or Shipping
        title="Confirm Delivery"
        isOpen={isShowDeliverConfirmation}
        onClose={function (): void {
          setIsShowDeliverConfirmation(false);
        }}
      >
        <div className="flex flex-col gap-6 p-4">
          <div className="text-center">
            <p className="text-gray-700">
              Deliver {selectedStoreSupplier?.data.items.length} items from{" "}
              <span className="font-semibold">
                {selectedStoreSupplier?.supplier.suppName}
              </span>{" "}
              (Supplier) to{" "}
              <span className="font-semibold">
                {selectedStoreSupplier?.data.storeName}
              </span>{" "}
              (Store)?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button size="sm" label="No, Cancel" color="nocolor" />
            <Button
              size="sm"
              label="Yes, Deliver"
              color="primary"
              onClick={() => {
                console.log({ selectedStoreSupplier });
                if (!selectedStoreSupplier) {
                  return;
                }
                const data: DeliverItemsToStore = {
                  storeId: selectedStoreSupplier?.data.storeId ?? 0,
                  poId: poData?.poId ?? 0,
                  requestId: selectedStoreSupplier.data.requestId,
                  items: selectedStoreSupplier?.data.items,
                  poItems:
                    selectedStoreSupplier?.data.items.map((poItem) => ({
                      poItemId: poItem.poItemId,
                    })) ?? [],
                };
                handleDeliverItemStore(data);
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReceivedPOView;
