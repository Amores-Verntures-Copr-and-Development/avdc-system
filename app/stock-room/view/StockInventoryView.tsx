import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { StockRoom } from "@/types/stockRoom";
import { fetcher } from "@/utils/fetcher";
import { getInventoryStatusInfo } from "@/utils/inventoryStatus";
import { Plus } from "lucide-react";
import React from "react";
import useSWR from "swr";
interface StockInventoryViewProps {
  data: StockRoom;
}
export const inventoryItemColumns: Column<DisplayInventoryItems>[] = [
  { name: "ID", key: "inventoryItemId" },
  { name: "Item Name", key: "itemName" },
  {
    name: "Quantity",
    key: "inventoryItemQuantity",
  },
  { name: "Price", key: "itemPrice" },
  { name: "Minimum", key: "inventoryItemMin" },

  { name: "Unit", key: "itemUnit" },
  { name: "Category", key: "categoryName" },
  {
    name: "Status",
    key: "status",
    selector: (row) => {
      const { status, bgClass, textClass } = getInventoryStatusInfo(
        row.inventoryItemQuantity,
        row.inventoryItemMin
      );

      return (
        <span
          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${bgClass} ${textClass}`}
        >
          {status}
        </span>
      );
    },
  },
];
const StockInventoryView = ({ data }: StockInventoryViewProps) => {
  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: DisplayInventoryItems[] }>(
    `/api/stock-room/${data.stockRoomId}/inventory`,
    fetcher
  );
  return (
    <div className="flex-1">
      <Table
        rowSize="h-10"
        renderTopActions={
          <div>
            <div>
              {" "}
              <Button icon={<Plus size={20} />} size="xs" label="Add Store" />
            </div>
          </div>
        }
        isRounded={false}
        textSize="xs"
        columns={inventoryItemColumns}
        data={response.data}
        totalCount={10}
        maxHeight="h-full"
      />
    </div>
  );
};

export default StockInventoryView;
