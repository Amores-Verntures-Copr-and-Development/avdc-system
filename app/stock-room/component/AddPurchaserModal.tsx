import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import { CreateStockPurchaser } from "@/dtos/stockRoom.dto";
import { UserAuth } from "@/hooks/useSession";
import { EmployeeInterface } from "@/types/employees";
import { StockPurchasers, StockRoom } from "@/types/stockRoom";
import { UserInterface } from "@/types/users";
import { fetcher } from "@/utils/fetcher";
import React, { useState } from "react";
import useSWR from "swr";
interface AddStoreToStockRoomModalProps {
  data: StockRoom;
  onCancel: () => void;
  onSubmit: (row: CreateStockPurchaser[]) => Promise<boolean>;
  user: UserAuth | null;
}
interface DisplayPurchasers
  extends UserInterface,
    EmployeeInterface,
    StockPurchasers {}
const userColumn: Column<DisplayPurchasers>[] = [
  { key: "#", name: "#", selector: (row, index) => index + 1 },
  {
    key: "userFname",
    name: "Name",
    selector: (row) => `${row.userFname} ${row.userLname}`,
  },
  {
    key: "empPosition",
    name: "Position",
    selector: (row) => (row.empPosition ? row.empPosition : row.userRole),
  },
];

const AddPurchaserModal = ({
  data,
  user,
  onCancel,
  onSubmit,
}: AddStoreToStockRoomModalProps) => {
  const [selectedRows, setSelectedRows] = useState<DisplayPurchasers[]>();
  const { data: response = { data: [] } } = useSWR<{
    data: DisplayPurchasers[];
  }>(`/api/stock-room/${data.stockRoomId}/purchaser/not-in`, fetcher);
  const handleSelectionChange = (selected: DisplayPurchasers[]) => {
    console.log("Selected rows:", selected);
    if (selected.length > 0) {
      setSelectedRows(selected);
    }
    if (selected.length === 0) {
      setSelectedRows(undefined);
    }
  };
  const handleSubmit = async () => {
    console.log;
    const newData: CreateStockPurchaser[] =
      selectedRows?.map((purchaser) => ({
        stockPurchaserAddedBy: user?.userId ?? 0,
        stockRoomId: data.stockRoomId,
        userId: purchaser.userId,
      })) ?? [];
    const success = await onSubmit(newData);
    if (success) {
      setSelectedRows(undefined);
      onCancel();
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm">
        <span className="font-semibold">Notes:</span> Purchasers manage stock
        room inventory and handle stock procurement.
      </span>
      <div>
        <Table
          showCheckBox
          onSelectionChange={handleSelectionChange}
          isRounded={false}
          columns={userColumn}
          data={response.data}
          uniqueIdKey="userId"
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

export default AddPurchaserModal;
