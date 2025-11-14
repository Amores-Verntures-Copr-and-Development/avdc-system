import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import { UserAuth } from "@/hooks/useSession";
import { EmployeeInterface } from "@/types/employees";
import { StockPurchasers, StockRoom } from "@/types/stockRoom";
import { UserInterface } from "@/types/users";
import { fetcher } from "@/utils/fetcher";
import React from "react";
import useSWR from "swr";
interface AddStoreToStockRoomModalProps {
  data: StockRoom;
  // onCancel: () => void;
  // onSubmit: (row: CreateStock[]) => Promise<boolean>;
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

const AddPurchaserModal = ({ data, user }: AddStoreToStockRoomModalProps) => {
  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: DisplayPurchasers[] }>(
    `/api/stock-room/${data.stockRoomId}/purchaser/not-in`,
    fetcher
  );
  const handleSubmit = async () => {};
  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm">
        <span className="font-semibold">Notes:</span> Purchasers manage stock
        room inventory and handle stock procurement.
      </span>
      <div>
        <Table
          showCheckBox
          //   onSelectionChange={handleSelectionChange}
          isRounded={false}
          columns={userColumn}
          data={response.data}
        />
      </div>
      <div className="flex justify-end gap-4">
        <div>
          <Button color="nocolor" size="sm" label="Cancel" />
        </div>
        <div>
          <Button size="sm" label="Submit" onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default AddPurchaserModal;
