import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";

import Table, { Column } from "@/components/shared/Table";
import {
  CreatePurchaseOrderItemDto,
  DisplayPurchaseOrderItemsDto,
  SupplierItemDetails,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { UserAuth } from "@/hooks/useSession";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import {
  ArrowLeft,
  Check,
  Clock,
  Edit,
  Layers2,
  Store,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import AddItemToPoModal from "./_components/AddItemToPoModal";
import IconButton from "@/components/shared/IconButton";
import {
  getPurchaseStatusOption,
  requestStatusOptions,
} from "@/utils/purchaserOrderUtils";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import { formatPeso } from "@/utils/formatPeso";
import Popup from "@/components/shared/Popup";
import ViewCompositePOItem from "./_components/ViewCompositePOItem";
import UpdateSupplierPrice from "./_components/UpdateSupplierPrice";
import { ApiResponse } from "@/types/api";
import DynamicDropdown from "@/components/shared/DynamicDropdown";

interface ShowAllIItemsProps {
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request" | "supplier">
  >;
  data: PurchaseOrders | null;
  onSubmit: (data: UpdatePurchaseOrdersDto) => Promise<boolean>;
  isLoading?: boolean;
  mutate: () => void;
  onClose: () => void;
  user: UserAuth | null;
  onAddItem: (
    data: CreatePurchaseOrderItemDto[],
    poId: number,
  ) => Promise<boolean>;
  onUpdateItem: (
    data: Partial<PurchaseOrderItems>,
    poId: number,
  ) => Promise<boolean>;
  onRemoveItem?: (
    data: Partial<PurchaseOrderItems>,
    poId: number,
  ) => Promise<boolean>;
}
type SupplierOption = {
  label: string;
  value: number;
};

const ShowAllIItems = ({
  setShowAllItems,
  data,
  user,
  onClose,
  onSubmit,
  isLoading,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: ShowAllIItemsProps) => {
  const [showComponent, setShowComponent] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [isShowUpdateSuppPrice, setIsShowUpdateSuppPrice] =
    useState<PurchaseOrderItems | null>(null);
  const {
    data: itemResponse = { data: [] },
    isLoading: loadingData,
    mutate,
  } = useSWR<ApiResponse<DisplayPurchaseOrderItemsDto[]>>(
    `/api/purchase-order/po-items/${data?.poId}`,
    fetcher,
  );
  const [filteredStatus, setFilteredStatus] = useState<
    "" | "delivered" | "received" | "not_ordered" | "pending" | "received_store"
  >("");
  const [showCompositeItem, setShowCompositeItem] =
    useState<DisplayPurchaseOrderItemsDto | null>(null);
  const [poItems, setPoItems] = useState<DisplayPurchaseOrderItemsDto[]>([]);
  const [isEditId, setIsEditId] = useState<number | null>(null);
  const [showDeleteItem, setShowDeleteItem] = useState(false);
  const [selectedItemId, setSelectedItem] =
    useState<DisplayPurchaseOrderItemsDto | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<number | "">("");
  const [originalPoItems, setOriginalPoItems] = useState<
    DisplayPurchaseOrderItemsDto[]
  >([]);
  const columns: Column<DisplayPurchaseOrderItemsDto>[] = [
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
      name: "Unit",
      key: "itemUnit",
    },
    {
      name: "Unit Price",
      key: "unitPrice",
      selector: (row) => formatPeso(row.unitPrice),
    },
    {
      name: "Ordered Qty",
      key: "poItemOrderedQty",
      editable: (row) => row.poItemId === isEditId,
      inputType: "number",
      selector: (row) =>
        formatQuantityByUnit(row.poItemOrderedQty, row.itemUnit ?? ""),
    },
    {
      name: "Received Qty",
      key: "poItemReceivedQty",
    },
    {
      name: "Supplier",
      key: "suppId",
      editable: (row) => row.poItemId === isEditId,
      inputType: "select",
      selectOptionVariant: "native",
      selector: (row) => {
        if (!row.suppliers?.length) return "No suppliers";

        const selectedId =
          row.selectedSupplierId !== undefined ? null : row.suppId;

        if (!selectedId) return "Select Supplier";

        const selected = row.suppliers.find(
          (s) => s.suppId === Number(selectedId),
        );

        return selected
          ? `${selected.suppName} (₱${selected.suppItemPrice})`
          : "Select Supplier";
      },
      value: (row) => {
        // Return empty string if explicitly cleared, otherwise use existing value
        if (
          row.selectedSupplierId !== undefined ||
          row.selectedSupplierId === null ||
          row.selectedSupplierId === ""
        ) {
          return row.selectedSupplierId === null
            ? null
            : String(row.selectedSupplierId);
        }

        // Initial load fallback (backend value)
        return row.suppId != null ? String(row.suppId) : null;
      },
      // Dropdown options
      options: (row: DisplayPurchaseOrderItemsDto) => {
        const supplierOptions =
          row.suppliers?.map((s: any) => ({
            label: `${s.suppName} (₱${s.suppItemPrice})`,
            value: s.suppId.toString(),
          })) ?? [];

        // Change from value: null to value: ""
        return [{ label: "Select...", value: "" }, ...supplierOptions];
      },
    },
    {
      name: "Total Price",
      key: "totalPrice",

      selector: (row) => {
        const hasComposite = row.composite && row.composite.length > 0;
        const supplier = row.suppliers?.find(
          (s) => s.suppId === Number(row.suppId),
        );

        const supplierPrice = Number(supplier?.suppItemPrice) || 0;
        const qty = Number(row.poItemOrderedQty) || 0;

        if (hasComposite) {
          const total = row.composite?.reduce((total, item) => {
            const subtotal = item.ordComQuantity * item.itemPrice;
            return (total += subtotal);
          }, 0);
          return `${formatPeso(total)}`;
        }
        return `₱${(supplierPrice * qty).toFixed(2)}`;
      },

      value: (row) => {
        const supplier = row.suppliers?.find(
          (s) => s.suppId === Number(row.suppId),
        );

        return (
          (Number(supplier?.suppItemPrice) || 0) *
          (Number(row.poItemOrderedQty) || 0)
        );
      },
    },
    {
      key: "composite",
      name: "Composite",
      selector: (row) => {
        const composite = row.composite || [];
        return (
          <div className="group relative">
            {composite.length > 0 && (
              <select
                className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
                disabled
              >
                <option value="">
                  {composite.filter((s) => s !== null).length > 0 &&
                    `Items (${composite.filter((s) => s !== null).length})`}
                </option>
              </select>
            )}
            {composite.filter((c) => c !== null).length > 0 && (
              <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto">
                {composite
                  .filter((c) => c !== null)
                  .map((c, index) => {
                    const total =
                      Number(c.ordComQuantity) * Number(c.itemPrice);

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
                          <span>Unit: {formatPeso(c.itemPrice)}</span>
                        </div>

                        <div className="flex justify-between font-semibold text-gray-800 mt-1">
                          <span>Total</span>
                          <span>{formatPeso(total)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      name: "Status",
      key: "poItemStatus",
      editable: (row) => row.poItemId === isEditId,
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
      selectOptionVariant: "custom",
      options: requestStatusOptions,
    },
  ];

  useEffect(() => {
    if (itemResponse.data && itemResponse.data.length > 0) {
      const cloned = structuredClone(itemResponse.data); // deep clone
      setPoItems(cloned);
      setOriginalPoItems(structuredClone(cloned));
    }
  }, [itemResponse.data]);
  const supplierOptions: SupplierOption[] = itemResponse.data
    .map((poItem) => {
      // Find the supplier matching poItem.suppId
      const supplier = poItem.suppliers?.find(
        (s) => s.suppId === poItem.suppId,
      );
      return supplier
        ? { label: supplier.suppName, value: supplier.suppId }
        : null;
    })
    .filter(Boolean) // remove nulls
    // Remove duplicates by value
    .filter(
      (option, index, self) =>
        index === self.findIndex((o) => o?.value === option!.value),
    ) as SupplierOption[];
  console.log({ supplierOptions });
  const handleApprovedPo = async () => {
    const newData: UpdatePurchaseOrdersDto = {
      ...data,
      poItems: poItems,
      updatedBy: user?.userId ?? 0,
    };
    const success = await onSubmit(newData);
    if (success) {
      onClose();
    }
  };
  const isRowChanged = (row: DisplayPurchaseOrderItemsDto) => {
    const original = originalPoItems.find((o) => o.poItemId === row.poItemId);
    if (!original) return false; // row not found, assume no change

    // Compare all fields you care about
    return (
      original.suppId !== (Number(row.suppId) || null) ||
      original.unitPrice !== row.unitPrice ||
      original.poItemOrderedQty !== row.poItemOrderedQty ||
      original.poItemReceivedQty !== row.poItemReceivedQty ||
      original.poItemStatus !== row.poItemStatus
    );
  };
  const handleUpdatePoItemSuppId = async (
    dataItem: Partial<PurchaseOrderItems>,
  ) => {
    if (!dataItem.poItemId) return;
    setIsUpdatingId(dataItem.poItemId);
    try {
      if (!data?.poId) return;
      const newData: Partial<PurchaseOrderItems> = {
        ...dataItem,
        suppId: Number(dataItem.suppId) || null,
      };

      const success = await onUpdateItem(newData, data.poId);
      if (success) {
        mutate();
        setIsEditId(null);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsUpdatingId(null);
    }
  };
  const handleRemoveItem = async () => {
    if (!selectedItemId?.poItemId || !data?.poId) return;
    setIsRemoving(true);
    try {
      if (onRemoveItem === undefined) return;
      const success = await onRemoveItem(selectedItemId, data.poId);
      if (success) {
        mutate();
        setShowDeleteItem(false);
        setSelectedItem(null);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsRemoving(false);
    }
  };
  const totalItems = poItems.length;
  const totalAmount = poItems
    .filter((item) => item.poItemStatus !== "not_ordered")
    .reduce((total, item) => {
      const hasComposite = item.composite && item.composite.length > 0;

      // if composite, total = sum of composite subtotal
      if (hasComposite) {
        const totalComposite = item.composite?.reduce((sum, comp) => {
          return sum + Number(comp.ordComQuantity) * Number(comp.itemPrice);
        }, 0);

        return total + Number(totalComposite);
      }

      // else normal item
      const qty = ["received", "completed"].includes(item.poItemStatus ?? "")
        ? Number(item.poItemReceivedQty)
        : Number(item.poItemOrderedQty);

      const subtotal = qty * Number(item.unitPrice);

      return total + subtotal;
    }, 0);
  const status = [
    { value: "", label: "All" },
    {
      value: "pending",
      label: `Pending  (${
        poItems?.filter(
          (i) =>
            i.poItemStatus === "pending" &&
            (supplierFilter !== "" ? i.suppId === supplierFilter : true),
        ).length
      })`,
    },

    {
      value: "delivered",
      label: `Delivered  (${
        poItems?.filter(
          (i) =>
            i.poItemStatus === "delivered" &&
            (supplierFilter !== "" ? i.suppId === supplierFilter : true),
        ).length
      })`,
    },
    {
      value: "received",
      label: `Received  (${
        poItems?.filter(
          (i) =>
            i.poItemStatus === "received" &&
            (supplierFilter !== "" ? i.suppId === supplierFilter : true),
        ).length
      })`,
    },
    {
      value: "received_store",
      label: `Received From Store (${
        poItems?.filter(
          (i) =>
            i.poItemStatus === "received_store" &&
            (supplierFilter !== "" ? i.suppId === supplierFilter : true),
        ).length
      })`,
    },
    {
      value: "not_ordered",
      label: `Not Ordered (${
        poItems?.filter(
          (i) =>
            i.poItemStatus === "not_ordered" &&
            (supplierFilter !== "" ? i.suppId === supplierFilter : true),
        ).length
      })`,
    },
  ];
  return (
    <div className="gap-5 bg-white h-full flex flex-col overflow-hidden p-4">
      <div className="flex justify-between items-center ">
        {" "}
        <h3 className="font-semibold text-gray-800 mb-3 text-lg flex-shrink-0">
          All Item list
        </h3>
        <div>
          <Button
            icon={ArrowLeft}
            color="neutral"
            size="xs"
            label="Back"
            onClick={() => {
              setShowAllItems("status");
            }}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Table
          renderTopActions={
            <div>
              <Button
                size="sm"
                label="Add Item"
                onClick={() => {
                  setShowAddItem(true);
                }}
              />
            </div>
          }
          showActions
          addContentLeftTitle={
            <div className="flex gap-2 items-center ">
              <div>
                {" "}
                <DynamicDropdown
                  options={supplierOptions}
                  onChange={function (value: string | number): void {
                    if (value) {
                      setSupplierFilter(Number(value));
                    } else {
                      setSupplierFilter("");
                    }
                  }}
                  placeholder={`Supplier (${supplierOptions.length})`}
                  icon={<Store className="w-3 h-3" />}
                  size="sm"
                />
              </div>
              <div className="flex gap-2 items-center">
                {status.map((s, index) => (
                  <div key={index}>
                    <Button
                      label={s.label}
                      size="xs"
                      color={
                        s.value === filteredStatus
                          ? s.value === ""
                            ? "primary"
                            : s.value === "pending"
                              ? "tertiary"
                              : s.value === "delivered"
                                ? "warning"
                                : s.value === "received"
                                  ? "success"
                                  : s.value === "received_store"
                                    ? "tertiary"
                                    : "danger"
                          : "secondary"
                      }
                      onClick={() => {
                        console.log(s.value);
                        setFilteredStatus(
                          s.value as
                            | ""
                            | "delivered"
                            | "received"
                            | "not_ordered"
                            | "received_store",
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          }
          localFilter={{
            keys: ["suppId", "poItemStatus"],
            values: {
              suppId:
                Number(supplierFilter) !== 0 ? Number(supplierFilter) : null,
              poItemStatus: filteredStatus || "pending",
            },
          }}
          renderActions={(row) => {
            const showSave = isRowChanged(row);
            return (
              <div className="flex gap-2 items-center justify-center">
                {isEditId !== row.poItemId ? (
                  <>
                    <IconButton
                      onClick={() => {
                        setIsEditId(row.poItemId);
                        // handleUpdatePoItemSuppId({
                        //   poItemId: row.poItemId,
                        //   suppId: row.suppId,
                        // });
                      }}
                      label="Edit Item"
                      icon={<Edit size={14} />}
                      bg="gray"
                    />
                    <IconButton
                      onClick={() => {
                        setShowCompositeItem(row);
                      }}
                      label="Composite Item"
                      icon={<Layers2 size={14} />}
                      bg="gray"
                    />
                    <IconButton
                      onClick={() => {
                        setIsShowUpdateSuppPrice(row);
                      }}
                      label="Update Supplier Price"
                      icon={<Store size={14} />}
                      bg="gray"
                    />
                    <IconButton
                      onClick={() => {
                        setShowDeleteItem(true);
                        setSelectedItem(row);
                      }}
                      label="Remove"
                      icon={<Trash2 size={14} />}
                      bg="red"
                    />
                  </>
                ) : (
                  <>
                    <IconButton
                      onClick={() => {
                        setPoItems(structuredClone(originalPoItems)); // restore fresh copy
                        setIsEditId(null);
                      }}
                      label="Cancel"
                      icon={<X size={14} />}
                      bg="red"
                      disable={isUpdatingId === row.poItemId}
                    />
                    <IconButton
                      onClick={() => {
                        handleUpdatePoItemSuppId({
                          poItemId: row.poItemId,
                          suppId: row.suppId,
                          poItemOrderedQty: row.poItemOrderedQty,
                          poItemStatus: row.poItemStatus,
                        });
                      }}
                      label="Save"
                      icon={<Check size={14} />}
                      bg="green"
                      disable={!showSave || isUpdatingId === row.poItemId}
                    />
                  </>
                )}
              </div>
            );
          }}
          uniqueIdKey="poItemId"
          localSearch={true}
          isRounded={false}
          loading={loadingData}
          columns={columns}
          data={poItems}
          maxHeight="h-full"
          updateData={setPoItems}
          onCellChange={(_rowIndex, key, value, row) => {
            // If supplier changed, update suppId and unitPrice too
            if (key === "selectedSupplierId") {
              const selected = row.suppliers?.find(
                (s) => s.suppId === Number(value),
              );
              setPoItems((prev) =>
                prev.map((item) =>
                  item.poItemId === row.poItemId
                    ? {
                        ...item,
                        selectedSupplierId: value ? Number(value) : null,
                        suppId: selected?.suppId ?? null,
                        unitPrice: selected?.suppItemPrice ?? 0,
                      }
                    : item,
                ),
              );
            }
            if (key === "poItemOrderedQty") {
              setPoItems((prev) =>
                prev.map((item) =>
                  item.poItemId === row.poItemId
                    ? { ...item, poItemOrderedQty: value }
                    : item,
                ),
              );
            }
          }}
        />
      </div>
      <div className="flex justify-end pr-2 pl-2">
        <div className="flex flex-col">
          <span className="text-gray-400 text-sm">
            Items:
            <span className="font-semibold"> {totalItems}</span>
          </span>
          <span className="text-gray-400 text-sm">
            Total:
            <span className="font-semibold"> {formatPeso(totalAmount)}</span>
          </span>
        </div>
      </div>
      <div className="border-t  border-gray-300  flex justify-between pl-4 pr-4 pt-4 pb-4 gap-4 items-center">
        <span className="flex items-center">
          <Clock size={15} />{" "}
          <span className="text-xs ml-2">
            {" "}
            Created: {formatDateToWords(data?.poCreatedAt ?? "")}
          </span>
        </span>
        {data?.poStatus === "pending" && (
          <div>
            <Button
              icon={Check}
              onClick={handleApprovedPo}
              size="sm"
              label="Approved"
              className="text-xs font-semibold"
              loading={isLoading}
            />
          </div>
        )}
      </div>
      <Modal
        title="Add Item to PO"
        isOpen={showAddItem}
        onClose={function (): void {
          setShowAddItem(false);
        }}
        size="lg"
        className="h-[50%]"
      >
        <AddItemToPoModal
          onAddItem={onAddItem}
          mutate={mutate}
          user={user}
          poId={data?.poId ?? 0}
          currentItemId={poItems.map((item) => item.itemId)}
        />
      </Modal>
      {/* <Modal
        isOpen={showDeleteItem}
        onClose={function (): void {
          setShowDeleteItem(false);
        }}
        title="Remove from PO"
      >
        <div></div>
      </Modal> */}
      <ConfirmationModal
        onConfirm={handleRemoveItem}
        confirmationInfo={
          "Are you sure you want to remove : " +
          selectedItemId?.itemName +
          " with " +
          formatQuantityByUnit(
            selectedItemId?.poItemOrderedQty ?? 0,
            selectedItemId?.itemUnit ?? "",
          ) +
          " ordered quantity?"
        }
        onClose={function (): void {
          setSelectedItem(null);
          setShowDeleteItem(false);
        }}
        isLoading={isRemoving}
        isShow={showDeleteItem}
        confirmLabel="Remove Item"
      />
      <Popup
        title="Composite Items"
        isOpen={showCompositeItem !== null}
        onClose={function (): void {
          setShowCompositeItem(null);
        }}
        background="bg-white-600"
        closeOnClickOutside={!showComponent}
      >
        <ViewCompositePOItem
          data={showCompositeItem}
          setShowComponent={setShowComponent}
        />
      </Popup>
      <Popup
        isOpen={isShowUpdateSuppPrice !== null}
        onClose={function (): void {
          setIsShowUpdateSuppPrice(null);
        }}
        background="bg-white/20"
        title={`Update Supplier Price`}
        closeOnClickOutside={false}
      >
        <UpdateSupplierPrice
          data={isShowUpdateSuppPrice}
          supplierName={
            itemResponse.data
              ?.find((s) => s.suppId === isShowUpdateSuppPrice?.suppId)
              ?.suppliers?.find(
                (sl) => sl.suppId === isShowUpdateSuppPrice?.suppId,
              )?.suppName || ""
          }
          onClose={function (): void {
            setIsShowUpdateSuppPrice(null);
          }}
          mutate={() => {
            mutate();
          }}
        />
      </Popup>
    </div>
  );
};

export default ShowAllIItems;
