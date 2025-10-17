import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayPurchaseOrderItemsDto,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { Check, Clock, Send } from "lucide-react";
import React, { useRef } from "react";

interface PendingPOViewProps {
  data: DisplayPurchaseOrderItemsDto[];
  poData: PurchaseOrders | null;
  onSubmit: (data: UpdatePurchaseOrdersDto) => Promise<boolean>;
}
const columns: Column<DisplayPurchaseOrderItemsDto>[] = [
  {
    name: "Item Name",
    key: "itemName",
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
    key: "selectedSupplierId",
    editable: true,
    inputType: "select",

    // 👇 Automatically choose the supplier with the lowest price if none is selected yet
    selector: (row) => {
      if (!row.suppliers?.length) return "No suppliers";

      // Auto-select the cheapest supplier if not selected yet
      if (!row.selectedSupplierId) {
        const cheapestSupplier = row.suppliers.reduce((prev, curr) =>
          curr.suppItemPrice < prev.suppItemPrice ? curr : prev
        );
        row.selectedSupplierId = cheapestSupplier.suppId;
        row.suppId = cheapestSupplier.suppId;
        row.unitPrice = cheapestSupplier.suppItemPrice;
      }

      // Display supplier name
      const selected = row.suppliers.find(
        (s) => s.suppId === Number(row.selectedSupplierId)
      );
      console.log("Selected: ", selected);
      return selected ? selected.suppName : "Select Supplier";
    },

    // Dropdown options
    options: (row: DisplayPurchaseOrderItemsDto) =>
      row.suppliers?.map((s: any) => ({
        label: `${s.suppName} (₱${s.suppItemPrice})`,
        value: s.suppId.toString(),
      })) ?? [],
  },
  {
    name: "Total Price",
    key: "totalPrice",
    selector: (row) => `₱${(row.totalPrice ?? 0).toFixed(2)}`,
    compute: (row) => {
      const selected = row.suppliers?.find(
        (s) => s.suppId === Number(row.selectedSupplierId)
      );
      const supplierPrice = selected?.suppItemPrice ?? 0;
      const quantity = row.poItemOrderedQty ?? 0;
      console.log("supplierPrice: ", supplierPrice);
      console.log("Row: ", row);
      console.log("Total: ", supplierPrice * quantity);
      return supplierPrice * quantity;
    },
    dependsOn: ["selectedSupplierId", "poItemOrderedQty"], // NEW
  },
];
const PendingPOView: React.FC<PendingPOViewProps> = ({
  data,
  poData,
  onSubmit,
}) => {
  const updatedItemsRef = useRef<DisplayPurchaseOrderItemsDto[]>([]);
  const handleDataUpdate = (updatedData: DisplayPurchaseOrderItemsDto[]) => {
    updatedItemsRef.current = updatedData; // Store without causing re-render
  };
  const handleApprovedPo = async () => {
    const updatedItems = updatedItemsRef.current;
    const newData: UpdatePurchaseOrdersDto = {
      ...poData,
      poItems: updatedItems,
    };
    const success = await onSubmit(newData);
    if (success) {
      alert("Purchased Order Approved!");
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="text-center border-t border-gray-300 mb-2">
        <p className="text-gray-700 font-medium">
          Assign suppliers to your items
        </p>
        <p className="text-gray-500 text-sm">
          Choose a supplier for each item to proceed with your purchase order.
        </p>
      </div>
      {/* Table */}
      <Table
        columns={columns}
        data={data}
        updateData={handleDataUpdate}
        onCellChange={(rowIndex, key, value, row) => {
          // If supplier changed, update suppId and unitPrice too
          if (key === "selectedSupplierId") {
            const selected = row.suppliers?.find(
              (s) => s.suppId === Number(value)
            );
            if (selected) {
              row.suppId = selected.suppId; // ✅ mirror value
              row.unitPrice = selected.suppItemPrice; // ✅ keep price updated
            }
          }
        }}
      />
      <div className="border-t flex justify-between pl-2 pr-2 pt-4 pb-4 gap-4 items-center">
        <span className="flex items-center">
          <Clock size={15} /> <span className="text-xs ml-2"> Created: </span>
        </span>
        <div>
          <Button
            icon={<Check size={15} />}
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
