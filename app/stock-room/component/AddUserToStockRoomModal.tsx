import Button from "@/components/shared/Button";

import Table, { Column } from "@/components/shared/Table";
import { CreateStockRoomUserDTO, CreateStockStore } from "@/dtos/stockRoom.dto";
import { UserAuth } from "@/hooks/useSession";
import { StockRoom } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import { UserInterface } from "@/types/users";
import { fetcher } from "@/utils/fetcher";
import React, { useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
interface AddStoreToStockRoomModalProps {
  data: StockRoom;
  onCancel: () => void;
  onSubmit: (row: CreateStockRoomUserDTO[]) => Promise<boolean>;
  user: UserAuth | null;
}

const columns: Column<UserInterface>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  {
    key: "name",
    name: "Name",
    selector: (row) => `${row.userFname} ${row.userLname}`,
  },
];
const AddStoreToStockRoomModal = ({
  data,
  onCancel,
  onSubmit,
  user,
}: AddStoreToStockRoomModalProps) => {
  const [selectedRows, setSelectedRows] = useState<UserInterface[]>();
  const [isAdding, setIsAdding] = useState(false);
  const { data: response = { data: [] } } = useSWR<{ data: UserInterface[] }>(
    `/api/stock-room/${data.stockRoomId}/user/not-in`,
    fetcher,
  );
  const handleSelectionChange = (selected: UserInterface[]) => {
    // 👉 Here you can trigger bulk delete, bulk approve, etc.
    if (selected.length > 0) {
      setSelectedRows(selected);
    }
    if (selected.length === 0) {
      setSelectedRows(undefined);
    }
  };
  const handleSubmit = async () => {
    setIsAdding(true);
    try {
      if (!user) {
        toast.error("No user found to procceed this action!");
        return;
      }
      const stockUserData: CreateStockRoomUserDTO[] =
        selectedRows?.map((u) => ({
          stockRoomId: data.stockRoomId,
          userId: u.userId,
          srUserAddedBy: user?.userId,
        })) ?? [];
      console.log("stockStoreData: ", stockUserData);
      const success = await onSubmit(stockUserData);
      if (success) {
        onCancel();
      }
    } catch (e) {
    } finally {
      setIsAdding(false);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm">
        <span className="font-semibold">Notes:</span> Users are linked to a
        stock room, which serves as their source of inventory.
      </span>
      <div>
        <Table
          showCheckBox
          onSelectionChange={handleSelectionChange}
          isRounded={false}
          columns={columns}
          data={response.data}
          uniqueIdKey="userId"
        />
      </div>
      <div className="flex justify-end gap-4">
        <div>
          <Button
            color="secondary"
            size="sm"
            label="Cancel"
            disabled={isAdding}
          />
        </div>
        <div>
          <Button
            size="sm"
            label="Submit"
            onClick={handleSubmit}
            loading={isAdding}
          />
        </div>
      </div>
    </div>
  );
};

export default AddStoreToStockRoomModal;
