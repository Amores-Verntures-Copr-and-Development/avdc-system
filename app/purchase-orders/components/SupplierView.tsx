import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";
import { PortalDropdown } from "@/components/shared/PortalDropDown";
import Table, { Column } from "@/components/shared/Table";
import { DisplayPOItemsSupplier } from "@/dtos/purchase.dto";
import { ApiResponse } from "@/types/api";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import { getPurchaseStatusOption } from "@/utils/purchaserOrderUtils";
import { ChevronDown, ChevronUp, Download, Package } from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { PDFViewer } from "@react-pdf/renderer";
import POSupplierItemsPDF from "@/components/pdf/POSupplierItemsPDF";
interface SupplierViewProps {
  data: PurchaseOrders | null;
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request" | "supplier">
  >;
}
const SupplierView = ({ data, setShowAllItems }: SupplierViewProps) => {
  const [isExpandedSupplier, setIsExpandedSupplier] = useState<number | null>(
    null,
  );
  const [showPDFSupplier, setShowPDFSupplier] =
    useState<DisplayPOItemsSupplier | null>(null);
  const [renderPDF, setRenderPDF] = useState(false);

  useEffect(() => {
    if (showPDFSupplier !== null) {
      setRenderPDF(false);

      const timer = setTimeout(() => {
        setRenderPDF(true);
      }, 100); // allow modal to open first

      return () => clearTimeout(timer);
    }
  }, [showPDFSupplier]);
  const columns: Column<PurchaseOrderItems>[] = [
    { name: "Item Name", key: "itemName" },
    { name: "Unit", key: "itemUnit" },
    {
      name: "Ordered Qty",
      key: "poItemOrderedQty",
      selector: (row) =>
        formatQuantityByUnit(row.poItemOrderedQty, row.itemUnit ?? ""),
    },
    {
      name: "Received Qty",
      key: "poItemReceivedQty",
      editable: (row) => row.poItemStatus === "sent",
      inputType: "number",
      selector: (row) =>
        row.poItemStatus === "not_ordered" ? 0 : row.poItemReceivedQty,
      value: (row) =>
        row.poItemStatus === "not_ordered"
          ? 0
          : Number(row.poItemReceivedQty) || "",
    },
    {
      name: "Price",
      key: "unitPrice",
      selector: (row) => formatPeso(row.unitPrice),
    },
    {
      name: "Supplier Price",
      key: "supplierPrice",
      selector: (row) => row.supplierPrice,
      editable: (row) => row.poItemStatus === "sent",
      inputType: "number",
    },
    {
      key: "composite",
      name: "Composite",
      selector: (row) => {
        const composite = row.composite || [];
        const filtered = composite.filter((c) => c !== null);

        if (filtered.length === 0) return null;
        return (
          <PortalDropdown
            trigger={
              <select
                className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
                disabled
              >
                <option>{`Items (${filtered.length})`}</option>
              </select>
            }
          >
            {filtered.map((c, index) => {
              const total = Number(c.ordComQuantity) * Number(c.ordComPrice);
              return (
                <div
                  key={index}
                  className="px-3 py-2 text-[10px] xl:text-xs hover:bg-gray-100 cursor-default border-b last:border-b-0"
                >
                  <div className="font-semibold text-gray-800">
                    {c.itemName}
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Qty: {c.ordComQuantity}</span>
                    <span>Unit: {formatPeso(c.ordComPrice)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-800 mt-1">
                    <span>Total</span>
                    <span>{formatPeso(total)}</span>
                  </div>
                </div>
              );
            })}
          </PortalDropdown>
        );
      },
    },
    {
      name: "Total",
      key: "total",
      selector: (row) => {
        const hasComposite = row.composite && row.composite.length > 0;

        if (row.poItemStatus === "not_ordered") return formatPeso(0);

        if (hasComposite) {
          const total = row?.composite
            ?.filter((c) => c !== null)
            .reduce((sum, item) => {
              return (
                sum + Number(item.ordComQuantity) * Number(item.ordComPrice)
              );
            }, 0);

          return formatPeso(total);
        }

        const qty =
          row.poItemReceivedQty > 0
            ? row.poItemReceivedQty
            : row.poItemOrderedQty;

        const price = row.supplierPrice || row.unitPrice;

        return formatPeso(Number(price) * Number(qty));
      },
      compute: (row) => {
        const hasComposite = row.composite && row.composite.length > 0;
        if (hasComposite) {
          const total = row.composite?.reduce((total, item) => {
            const subtotal = item.ordComQuantity * item.itemPrice;
            return (total += subtotal);
          }, 0);
          return `${formatPeso(total)}`;
        }
        return row.poItemReceivedQty * (row.supplierPrice || row.unitPrice);
      },
      dependsOn: ["poItemOrderedQty", "unitPrice", "supplierPrice"],
    },
    {
      name: "Status",
      key: "poItemStatus",

      selector: (row) => {
        const { bg, color, label } = getPurchaseStatusOption(
          row.poItemStatus ?? "",
        );
        return (
          <div className={`${bg} ${color} text-center py-1 px-.5 rounded-sm`}>
            <span>{label}</span>
          </div>
        );
      },
      inputType: "select",
      selectOptionVariant: "custom", // ✅ matches interface
      options: (row) => {
        const { label, value, bg, color, border, dot } =
          getPurchaseStatusOption(row.poItemStatus ?? "");
        return [
          { label, value, bg, color, border, dot },
          {
            label: "Not Ordered",
            value: "not_ordered",
            bg: "bg-red-100",
            color: "text-red-600",
            border: "border-red-1/50",
            dot: "bg-red-500",
          },
        ];
      },
      value: (row) => row.poItemStatus,
    },
  ];
  const { data: itemResponse = { data: [] }, isLoading: loadingData } = useSWR<
    ApiResponse<DisplayPOItemsSupplier[]>
  >(`/api/purchase-order/po-items-supplier/${data?.poId}`, fetcher);
  console.log({ itemResponse });
  const totalPurchase = itemResponse.data.reduce((sum, s) => {
    const totalItemsSupplier = s.items
      .filter(
        (i) =>
          i.poItemStatus === "sent" ||
          i.poItemStatus === "received" ||
          i.poItemStatus === "delivered" ||
          i.poItemStatus === "received_store",
      )
      .reduce((total, item) => {
        if (item.poItemStatus === "not_ordered") return total;

        const hasComposite = item.composite && item.composite.length > 0;

        if (hasComposite) {
          const compositeTotal = item.composite
            ?.filter((c) => c !== null)
            .reduce((sum, c) => {
              return (
                sum + Number(c.ordComQuantity || 0) * Number(c.ordComPrice || 0)
              );
            }, 0);

          return total + Number(compositeTotal || 0);
        }

        const price = Number(item.supplierPrice || item.unitPrice || 0);

        const qty = Number(
          Number(item.poItemReceivedQty || 0) > 0
            ? item.poItemReceivedQty
            : item.poItemOrderedQty || 0,
        );

        return total + price * qty;
      }, 0);

    return sum + totalItemsSupplier;
  }, 0);
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex justify-between shadow bg-white p-2 mb-2 rounded">
        <div>
          <h1 className="font-semibold text-sm 2xl:text-md">
            Overview of Suppliers
          </h1>
          <span className="text-xs font-semibold">
            Total Supplier Purchase: {formatPeso(totalPurchase)}
          </span>
        </div>
        <div>
          <Button
            label="Back"
            size="sm"
            onClick={() => {
              setShowAllItems("status");
            }}
          />
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto min-h-0">
        {loadingData ? (
          <LoaderComponent />
        ) : (
          itemResponse.data &&
          itemResponse.data.map((s, index) => {
            const totalItemsSupplier = s.items
              .filter(
                (i) =>
                  i.poItemStatus === "sent" ||
                  i.poItemStatus === "received" ||
                  i.poItemStatus === "delivered" ||
                  i.poItemStatus === "received_store",
              )
              .reduce((total, item) => {
                // skip not_ordered (extra safety)
                if (item.poItemStatus === "not_ordered") return total;

                const hasComposite =
                  item.composite && item.composite.length > 0;

                if (hasComposite) {
                  const compositeTotal = item.composite
                    ?.filter((c) => c !== null)
                    .reduce((sum, c) => {
                      return (
                        sum + Number(c.ordComQuantity) * Number(c.ordComPrice)
                      );
                    }, 0);

                  return total + Number(compositeTotal);
                }

                const price = Number(item.supplierPrice || item.unitPrice) || 0;

                const qty = Number(
                  item.poItemReceivedQty > 0
                    ? item.poItemReceivedQty
                    : item.poItemOrderedQty,
                );

                return total + price * qty;
              }, 0);
            return (
              <div
                key={index}
                className="border border-gray-200 shadow  rounded-lg overflow-hidden flex flex-col p-2   bg-white  cursor-pointer hover:from-gray-100 transition "
              >
                <div className="bg-gradient-to-r flex flex-col gap-2">
                  <div className="flex justify-between overflow-visible">
                    <div className="flex items-start gap-2">
                      <Package className="text-primary-1" size={24} />
                      <div className="flex flex-col items-start gap-1">
                        <h1 className="font-semibold text-sm">{s.suppName}</h1>
                        <div className="flex text-xs text-gray-600 gap-4">
                          {s.suppAddress && (
                            <span>Location: {s.suppAddress}</span>
                          )}
                          {s.suppEmail && <span>Email: {s.suppEmail}</span>}
                          {s.suppPhone && <span>Phone: {s.suppPhone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="flex flex-col gap-2 items-end">
                        <span className="text-[9px] xl:text-xs">
                          Total Amount
                        </span>
                        <p className="font-bold text-primary-1 text-sm xl:text-lg">
                          {formatPeso(totalItemsSupplier)}
                        </p>
                        <span className="text-[9px] xl:text-xs">
                          {s.items.length} item(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-300"></div>
                  <div className="flex justify-end gap-2">
                    <div>
                      <Button
                        size="xs"
                        color="secondary"
                        label="PDF"
                        icon={Download}
                        className="font-semibold text-gray-700 text-xs"
                        onClick={() => {
                          setShowPDFSupplier(s);
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        console.log(s);
                        setIsExpandedSupplier(
                          isExpandedSupplier ? null : s.suppId,
                        );
                      }}
                      className="inline-flex items-center px-1 py-.5 xl:px-3 xl:py-1.5 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {isExpandedSupplier === s.suppId
                        ? "Hide Details"
                        : "View Details"}
                      {isExpandedSupplier === s.suppId ? (
                        <ChevronUp className="w-4 h-4 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-2" />
                      )}
                    </button>
                  </div>
                </div>
                {isExpandedSupplier === s.suppId && (
                  <div className="p-2 flex flex-col h-full gap-2 bg-gray-100/30">
                    <Table
                      uniqueIdKey="itemId"
                      localSearch={true}
                      textSize="xs"
                      columns={columns}
                      data={s.items}
                      isRounded={false}
                      showActions
                      loading={loadingData}
                      // renderTopActions={
                      //   <div className="flex gap-2">
                      //     {!isAllNotOrdered && (
                      //       <div>
                      //         <Button
                      //           hasBorder
                      //           color="neutral"
                      //           size="xs"
                      //           onClick={() => {
                      //             setShowAddItem(true);
                      //             setSelectedSupplierToAdd(supplier);
                      //           }}
                      //           label="Add Item"
                      //           icon={Package}
                      //         />
                      //       </div>
                      //     )}

                      //     {isSupplierItemsSent && (
                      //       <div>
                      //         <Button
                      //           color="success"
                      //           hasBorder
                      //           size="xs"
                      //           onClick={() =>
                      //             handleAutoFillAll(supplier.suppId)
                      //           }
                      //           label="Auto-Fill All"
                      //           icon={PackageCheck}
                      //           className="font-semibold text-white text-xs"
                      //         />
                      //       </div>
                      //     )}
                      //     {validForReceived && (
                      //       <div>
                      //         <Button
                      //           color="danger"
                      //           hasBorder
                      //           size="xs"
                      //           onClick={() =>
                      //             // handleNotOrderedSupplier(supplier)
                      //             setSelectSupplierNotOrder(supplier)
                      //           }
                      //           label="Mark as Unordered"
                      //           icon={PackageMinus}
                      //           className="font-semibold text-white text-xs"
                      //         />
                      //       </div>
                      //     )}
                      //     {validForReceived && (
                      //       <div>
                      //         {" "}
                      //         <Button
                      //           size="xs"
                      //           hasBorder
                      //           onClick={() => {
                      //             // handleReceivePO([supplier]);
                      //             const hasNoQuantityDelivered =
                      //               supplier.items.some(
                      //                 (item) =>
                      //                   item.poItemStatus !== "not_ordered" &&
                      //                   Number(item.poItemReceivedQty) === 0,
                      //               );

                      //             if (hasNoQuantityDelivered) {
                      //               toast.error(
                      //                 "There are items to be received with no quantity!",
                      //               );
                      //               return;
                      //             }

                      //             if (supplier) {
                      //               setIsShowReceivedConfirm(true);
                      //               setSupplierReceivedData([supplier]);
                      //             }
                      //           }}
                      //           color="primary"
                      //           label="Receive PO"
                      //           icon={Package}
                      //           className="font-semibold"
                      //         />
                      //       </div>
                      //     )}
                      //   </div>
                      // }
                      // renderActions={(row) => (
                      //   <div className="flex justify-center gap-2">
                      //     <IconButton
                      //       onClick={() => {
                      //         setShowCompositeItem({
                      //           poId: row.poId,
                      //           itemId: row.itemId,
                      //           poItemId: row.poItemId,
                      //           poItemOrderedQty: row.poItemOrderedQty,
                      //           poItemReceivedQty: row.poItemReceivedQty,
                      //           unitPrice: row.supplierPrice ?? 0,
                      //           suppId: row.suppId,
                      //           suppliers: [],
                      //           selectedSupplierId: row.suppId,
                      //           poItemStatus: row.poItemStatus,
                      //           totalPrice: 0,
                      //           composite: row.composite,
                      //           itemName: row.itemName ?? "",
                      //           itemUnit: row.itemUnit ?? "",
                      //         });
                      //       }}
                      //       label="Composite Item"
                      //       icon={<Layers2 size={14} />}
                      //       bg="gray"
                      //     />

                      //     {row.poItemStatus === "sent" && (
                      //       <IconButton
                      //         icon={<PackageCheck size={14} />}
                      //         onClick={() => {
                      //           if (!row.suppId) {
                      //             return;
                      //           }
                      //           handleAutoFill(row.suppId, row.poItemId);
                      //         }}
                      //         label="Auto-Fill Received Qty"
                      //         bg="primary"
                      //       />
                      //     )}
                      //     <IconButton
                      //       icon={<Replace size={14} />}
                      //       onClick={() => {
                      //         if (!row) {
                      //           return;
                      //         }

                      //         setShowReplaceItem(row);
                      //       }}
                      //       label="Replace Item"
                      //       bg="green"
                      //     />
                      //     <IconButton
                      //       icon={<Store size={14} />}
                      //       onClick={() => {
                      //         if (!row) {
                      //           return;
                      //         }
                      //         setIsShowUpdateSuppPrice(row);
                      //       }}
                      //       label="Update Supplier Price"
                      //       bg="tertiary"
                      //     />
                      //   </div>
                      // )}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="p-2 shadow"></div>
      <Modal
        className="h-[95%]"
        isOpen={showPDFSupplier !== null}
        size="xl"
        onClose={function (): void {
          setShowPDFSupplier(null);
        }}
        title="Supplier PDF"
      >
        {renderPDF && showPDFSupplier ? (
          <PDFViewer width="100%" height="100%">
            <POSupplierItemsPDF data={showPDFSupplier} poData={data} />
          </PDFViewer>
        ) : (
          <div className="flex items-center justify-center h-full">
            Generating PDF...
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupplierView;
