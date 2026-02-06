import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";

import Table, { Column } from "@/components/shared/Table";
import {
  DisplayPurchaseOrderItemsDto,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { UserAuth } from "@/hooks/useSession";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { Check, Clock } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PendingPOViewProps {
  data: DisplayPurchaseOrderItemsDto[];
  poData: PurchaseOrders | null;
  onSubmit: (data: UpdatePurchaseOrdersDto) => Promise<boolean>;
  isLoading?: boolean;
  mutate: () => void;
  onClose: () => void;
  user: UserAuth | null;
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request">
  >;
}

const PendingPOView: React.FC<PendingPOViewProps> = ({
  data,
  poData,
  onSubmit,
  isLoading,

  onClose,
  user,
  setShowAllItems,
}) => {
  const [poItems, setPoItems] = useState<DisplayPurchaseOrderItemsDto[]>(data);
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
      name: "Ordered Qty",
      key: "poItemOrderedQty",
    },
    {
      name: "Received Qty",
      key: "poItemReceivedQty",
    },
    {
      name: "Supplier",
      key: "suppId",
      editable: true,
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

        return selected ? selected.suppName : "Select Supplier";
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
      selector: (row) => `₱${(row.totalPrice ?? 0).toFixed(2)}`,
      compute: (row) => {
        const selected = row.suppliers?.find(
          (s) => s.suppId === Number(row.selectedSupplierId),
        );
        const supplierPrice = Number(selected?.suppItemPrice) ?? 0;
        const quantity = Number(row.poItemOrderedQty) ?? 0;
        return supplierPrice * quantity;
      },
      dependsOn: ["selectedSupplierId", "poItemOrderedQty"], // NEW
    },
  ];
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  useEffect(() => {
    if (data && data.length > 0) {
      setPoItems(data);
    }
  }, [data]);
  const handleApprovedPo = async () => {
    const modifyPoItems = poItems.map((item) => ({
      ...item,
      suppId: Number(item.suppId) || null,
    }));
    const newData: UpdatePurchaseOrdersDto = {
      ...poData,
      poItems: modifyPoItems,
      updatedBy: user?.userId ?? 0,
    };
    console.log({ modifyPoItems });
    const success = await onSubmit(newData);
    if (success) {
      onClose();
    }
  };
  const seen = new Set<number>();
  const supplierOptions = [
    { label: "Select...", value: "" }, // no-value option
    ...poItems
      .flatMap((item) => item.suppliers || [])
      .filter((supp) => !seen.has(supp.suppId) && seen.add(supp.suppId))
      .map((supp) => ({
        label: supp.suppName,
        value: supp.suppId.toString(),
      })),
  ];
  const handleAssignSupplier = (id: number | null) => {
    // If no supplier is selected, clear all assigned suppliers
    if (!id) {
      const updatedItems = poItems.map((item) => ({
        ...item,
        suppId: null,
      }));
      setPoItems(updatedItems);
      return;
    }

    // Assign selected supplier to matching items
    const updatedItems = poItems.map((item) => {
      const selectedSupplier = item.suppliers?.find((s) => s.suppId === id);
      if (selectedSupplier) {
        return {
          ...item,
          suppId: selectedSupplier.suppId,
        };
      }
      return item;
    });

    setPoItems(updatedItems);
  };
  return (
    <div className="gap-5 bg-white h-full flex flex-col overflow-hidden">
      <div className="flex flex-col gap-2 h-full w-full overflow-hidden pr-2 pl-2">
        <div className="text-center border-t border-gray-300 p-2">
          <p className="text-gray-700 text-xs 2xl:text-sm font-medium">
            Assign suppliers to your items
          </p>
          <p className="text-gray-500 text-xs 2xl:text-sm">
            Choose a supplier for each item to proceed with your purchase order.
          </p>
        </div>
        <div className="flex justify-between items-center">
          {" "}
          <h3 className="font-semibold text-gray-800 mb-3 text-lg flex-shrink-0">
            Order Items by Supplier
          </h3>
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
        <div className="flex items-end gap-2">
          {/* Dropdown */}
          <div className="w-30 xl:w-50">
            <label className="text-xs font-semibold">Assign Suppliers</label>
            <DropdownSelect
              sizes="xs"
              name="supplier"
              value={String(selectedSupplier) ?? ""}
              options={supplierOptions}
              onChange={(e) =>
                setSelectedSupplier(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            />
          </div>

          {/* Apply Button */}
          <div>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
              onClick={() => handleAssignSupplier(Number(selectedSupplier))}
            >
              Apply
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Table
            uniqueIdKey="poItemId"
            isRounded={false}
            loading={isLoading}
            columns={columns}
            data={poItems}
            maxHeight="h-full"
            updateData={setPoItems}
            onCellChange={(rowIndex, key, value, row) => {
              // If supplier changed, update suppId and unitPrice too
              if (key === "selectedSupplierId") {
                const selected = row.suppliers?.find(
                  (s) => s.suppId === Number(value),
                );
                if (selected) {
                  row.suppId = selected.suppId; // ✅ mirror value
                  row.unitPrice = selected.suppItemPrice; // ✅ keep price updated
                }
              }
            }}
          />
        </div>
      </div>
      <div className="border-t  border-gray-300  flex justify-between pl-4 pr-4 pt-4 pb-4 gap-4 items-center">
        <span className="flex items-center">
          <Clock size={15} />{" "}
          <span className="text-xs ml-2">
            {" "}
            Created: {formatDateToWords(poData?.poCreatedAt ?? "")}
          </span>
        </span>
        <div>
          <Button
            icon={Check}
            onClick={handleApprovedPo}
            size="sm"
            label="Approved"
            className="text-xs font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default PendingPOView;
