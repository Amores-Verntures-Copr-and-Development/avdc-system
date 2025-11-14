import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import { EmployeeInterface } from "@/types/employees";
import { StockPurchasers, StockRoom } from "@/types/stockRoom";
import { UserInterface } from "@/types/users";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import AddPurchaserModal from "../component/AddPurchaserModal";
import { UserAuth } from "@/hooks/useSession";
import { CreateStockPurchaser } from "@/dtos/stockRoom.dto";

interface StockPurchaserViewProps {
  data: StockRoom;
  user: UserAuth | null;
}
interface DisplayPurchasers
  extends StockPurchasers,
    UserInterface,
    EmployeeInterface {}
const purchaserColumns: Column<DisplayPurchasers>[] = [
  { key: "#", name: "#", selector: (row, index) => index + 1 },
  {
    key: "userFname",
    name: "Name",
    selector: (row) => `${row.userFname} ${row.userLname}`,
  },
  {
    key: "empPosition",
    name: "Position",
  },
  {
    key: "stockPurchaserCreatedAt",
    name: "Assigned At",
    selector: (row) => formatDateToWords(row.stockPurchaserCreatedAt),
  },
];
const StockPurchaserView = ({ data, user }: StockPurchaserViewProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: DisplayPurchasers[] }>(
    `/api/stock-room/${data.stockRoomId}/purchaser`,
    fetcher
  );
  console.log({ user });
  const handleAddPurchaser = async (purchaserData: CreateStockPurchaser[]) => {
    console.log("CreateStockPurchaser: ", purchaserData);
    return true;
  };
  return (
    <div className="flex-1">
      <Table
        renderTopActions={
          <div>
            <div>
              {" "}
              <Button
                icon={<Plus size={20} />}
                size="xs"
                label="Assign Purchaser"
                onClick={() => {
                  setShowAdd(true);
                }}
              />
            </div>
          </div>
        }
        isRounded={false}
        columns={purchaserColumns}
        data={response.data}
        totalCount={10}
        maxHeight="h-full"
      />
      <Modal
        title="Assign Purchaser"
        size="xl"
        isOpen={showAdd}
        onClose={function (): void {
          setShowAdd(false);
        }}
      >
        <AddPurchaserModal
          data={data}
          user={user}
          onCancel={() => {
            setShowAdd(false);
          }}
          onSubmit={handleAddPurchaser}
        />
      </Modal>
    </div>
  );
};

export default StockPurchaserView;
