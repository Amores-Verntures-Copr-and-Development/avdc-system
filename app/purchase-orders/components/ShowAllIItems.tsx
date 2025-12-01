import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayPurchaseOrderItemsDto,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { UserAuth } from "@/hooks/useSession";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { Check, Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

interface ShowAllIItemsProps {
  setShowAllItems: React.Dispatch<
    React.SetStateAction<"status" | "all" | "request">
  >;
  data: PurchaseOrders | null;
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
      if (row.suppId)
        return row.suppliers?.find((supp) => supp.suppId === row.suppId)
          ?.suppName;
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
    value: (row) => {
      return (row.suppId || row.selectedSupplierId)?.toString();
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
const ShowAllIItems = ({
  setShowAllItems,
  data,
  user,
  onClose,
  onSubmit,
  isLoading,
}: ShowAllIItemsProps) => {
  const {
    data: itemResponse = { data: [] },
    isLoading: loadingData,
    mutate,
  } = useSWR<{ data: any }>(
    `/api/purchase-order/po-items/${data?.poId}`,
    fetcher
  );
  const [poItems, setPoItems] = useState<DisplayPurchaseOrderItemsDto[]>([]);
  useEffect(() => {
    if (itemResponse.data && itemResponse.data.length > 0) {
      setPoItems(itemResponse.data);
    }
  }, [itemResponse.data]);
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
  return (
    <div className="gap-5 bg-white h-full flex flex-col overflow-hidden p-4">
      <div className="flex justify-between items-center ">
        {" "}
        <h3 className="font-semibold text-gray-800 mb-3 text-lg flex-shrink-0">
          All Item list
        </h3>
        <div>
          <Button
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
          isRounded={false}
          loading={isLoading}
          columns={columns}
          data={itemResponse.data}
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
      <div className="border-t  border-gray-300  flex justify-between pl-4 pr-4 pt-4 pb-4 gap-4 items-center">
        <span className="flex items-center">
          <Clock size={15} />{" "}
          <span className="text-xs ml-2">
            {" "}
            Created: {formatDateToWords(data?.poCreatedAt ?? "")}
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

export default ShowAllIItems;
