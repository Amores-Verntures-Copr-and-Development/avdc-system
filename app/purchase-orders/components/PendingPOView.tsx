import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayPurchaseOrderItemsDto,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { UserAuth } from "@/hooks/useSession";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { Check, Clock } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface PendingPOViewProps {
  data: DisplayPurchaseOrderItemsDto[];
  poData: PurchaseOrders | null;
  onSubmit: (data: UpdatePurchaseOrdersDto) => Promise<boolean>;
  isLoading?: boolean;
  mutate: () => void;
  onClose: () => void;
  user: UserAuth | null;
}
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
  isLoading,
  mutate,
  onClose,
  user,
}) => {
  const [poItems, setPoItems] = useState<DisplayPurchaseOrderItemsDto[]>(data);
  useEffect(() => {
    if (data && data.length > 0) {
      setPoItems(data);
    }
  }, [data]);
  const handleApprovedPo = async () => {
    console.log({ poItems });
    const newData: UpdatePurchaseOrdersDto = {
      ...poData,
      poItems: poItems,
      updatedBy: user?.userId ?? 0,
    };
    const success = await onSubmit(newData);
    if (success) {
      onClose();
    }
  };
  return (
    <div className="gap-5 bg-white h-full flex flex-col overflow-hidden">
      <div className="flex flex-col h-full w-full overflow-hidden pr-2 pl-2">
        <div className="text-center border-t border-gray-300 p-2">
          <p className="text-gray-700 font-medium">
            Assign suppliers to your items
          </p>
          <p className="text-gray-500 text-sm">
            Choose a supplier for each item to proceed with your purchase order.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Table
            isRounded={false}
            loading={isLoading}
            columns={columns}
            data={data}
            maxHeight="h-full"
            updateData={setPoItems}
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
