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
import toast from "react-hot-toast";

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

  const handleAddPurchaser = async (purchaserData: CreateStockPurchaser[]) => {
    console.log("CreateStockPurchaser: ", purchaserData);
    try {
      const result = await fetch(
        `api/stock-room/${data.stockRoomId}/purchaser`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(purchaserData),
        }
      );
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      return true;
    } catch (e) {
      toast.error("Failed to add store.");
      return false;
    }
  };
  return (
    <div className="flex-1">
      <Table
        loading={isLoading}
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
