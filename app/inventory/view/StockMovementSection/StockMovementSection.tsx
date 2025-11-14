import Table, { Column } from "@/components/shared/Table";
import { DisplayInventoryMovementDto } from "@/dtos/inventory.dto";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { getMovementType } from "@/utils/formatMovementType";
import React from "react";
import useSWR from "swr";
const columns: Column<DisplayInventoryMovementDto>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { name: "Item Name", key: "itemName" },
  { name: "Unit", key: "itemUnit" },
  { name: "Category", key: "categoryName" },
  {
    name: "Type",
    key: "itemMovementType",
    selector: (row) => {
      const { type, textClass, bgClass, borderClass } = getMovementType(
        row.itemMovementType
      );
      return (
        <div className="py-1">
          {" "}
          <span
            className={`px-2 py-1 rounded-lg font-semibold ${bgClass} ${textClass} ${borderClass} text-[10px]`}
          >
            {type}
          </span>
        </div>
      );
    },
  },
  { name: "Reference", key: "itemMovementReference" },
  { name: "Quantity", key: "itemMovementQuantity" },
  {
    name: "Created At",
    key: "itemMovementCreatedAt",
    selector: (row) => formatDateToWords(row.itemMovementCreatedAt ?? ""),
  },
  { name: "Remarks", key: "itemMovementRemarks" },
];
interface StockMovementSectionProps {
  inventoryId: number | null;
}
const StockMovementSection: React.FC<StockMovementSectionProps> = ({
  inventoryId,
}) => {
  const { data: itemResponse = { data: [] }, isLoading: loading } = useSWR<{
    data: DisplayInventoryMovementDto[];
  }>(inventoryId ? `/api/inventory/movement/${inventoryId}` : null, fetcher);
  return (
    <>
      <Table
        maxHeight="h-full"
        columns={columns}
        data={itemResponse.data}
        loading={loading}
        totalCount={20}
      />
    </>
  );
};

export default StockMovementSection;
