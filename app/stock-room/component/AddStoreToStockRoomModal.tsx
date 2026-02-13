import Button from "@/components/shared/Button";

import Table, { Column } from "@/components/shared/Table";
import { CreateStockStore } from "@/dtos/stockRoom.dto";
import { UserAuth } from "@/hooks/useSession";
import { StockRoom } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import React, { useState } from "react";
import useSWR from "swr";
interface AddStoreToStockRoomModalProps {
  data: StockRoom;
  onCancel: () => void;
  onSubmit: (row: CreateStockStore[]) => Promise<boolean>;
  user: UserAuth | null;
}

const columns: Column<StoreInterface>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "storeName", name: "Name" },
  { key: "storeEmail", name: "Email" },
  { key: "storePhone", name: "Phone" },
  { key: "storeLocation", name: "Location" },
];
const AddStoreToStockRoomModal = ({
  data,
  onCancel,
  onSubmit,
  user,
}: AddStoreToStockRoomModalProps) => {
  const [selectedRows, setSelectedRows] = useState<StoreInterface[]>();
  const { data: response = { data: [] } } = useSWR<{ data: StoreInterface[] }>(
    `/api/stock-room/${data.stockRoomId}/search`,
    fetcher,
  );
  const handleSelectionChange = (selected: StoreInterface[]) => {
    // 👉 Here you can trigger bulk delete, bulk approve, etc.
    if (selected.length > 0) {
      setSelectedRows(selected);
    }
    if (selected.length === 0) {
      setSelectedRows(undefined);
    }
  };
  const handleSubmit = async () => {
    const stockStoreData: CreateStockStore[] =
      selectedRows?.map((store) => ({
        stockRoomId: data.stockRoomId,
        stockStoresAddedBy: user?.userId ?? 0,
        storeId: store.storeId ?? 0,
      })) ?? [];
    console.log("stockStoreData: ", stockStoreData);
    const success = await onSubmit(stockStoreData);
    if (success) {
      onCancel();
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm">
        <span className="font-semibold">Notes:</span> Stores are linked to a
        stock room, which serves as their source of inventory.
      </span>
      <div>
        <Table
          showCheckBox
          onSelectionChange={handleSelectionChange}
          isRounded={false}
          columns={columns}
          data={response.data}
        />
      </div>
      <div className="flex justify-end gap-4">
        <div>
          <Button color="secondary" size="sm" label="Cancel" />
        </div>
        <div>
          <Button size="sm" label="Submit" onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default AddStoreToStockRoomModal;
