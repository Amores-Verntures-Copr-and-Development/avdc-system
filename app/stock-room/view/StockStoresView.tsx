import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import { StockPurchasers, StockRoom, StockStores } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import AddStoreToStockRoomModal from "../component/AddStoreToStockRoomModal";
import { CreateStockStore } from "@/dtos/stockRoom.dto";
import { UserAuth } from "@/hooks/useSession";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import toast from "react-hot-toast";
import { formatDateToWords } from "@/utils/formatDateToWords";

interface DisplayStores extends StoreInterface, StockStores {}

const columns: Column<DisplayStores>[] = [
  { key: "#", name: "#", selector: (row, index) => index + 1 },
  { key: "storeName", name: "Name" },
  { key: "storeContactPhone", name: "Phone" },
  { key: "storeEmail", name: "Email" },
  { key: "storeLocation", name: "Location" },
  {
    key: "stockStoresCreatedAt",
    name: "Assigned Date",
    selector: (row) => formatDateToWords(row.stockStoresCreatedAt),
  },
];
interface StockStoresViewProps {
  data: StockRoom;
  user: UserAuth | null;
}
const StockStoresView = ({ data, user }: StockStoresViewProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: DisplayStores[] }>(
    `/api/stock-room/${data.stockRoomId}/store`,
    fetcher
  );
  const handleAddStore = async (dataStore: CreateStockStore[]) => {
    console.log("DataStore: ", dataStore);
    try {
      const result = await fetch(`api/stock-room/${data.stockRoomId}/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataStore),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add store.");
      return false;
    }
  };
  return (
    <>
      <Table
        loading={isLoading}
        renderTopActions={
          <div>
            <div>
              <Button
                icon={<Plus size={20} />}
                size="xs"
                label="Add Store"
                onClick={() => {
                  setShowAdd(true);
                }}
              />
            </div>
          </div>
        }
        isRounded={false}
        columns={columns}
        data={response.data}
        totalCount={10}
        maxHeight="h-full"
      />
      <Modal
        title="Add Store"
        size="xl"
        className=""
        isOpen={showAdd}
        onClose={function (): void {
          setShowAdd(false);
        }}
      >
        <AddStoreToStockRoomModal
          user={user}
          data={data}
          onCancel={() => {
            setShowAdd(false);
          }}
          onSubmit={handleAddStore}
        />
      </Modal>
    </>
  );
};

export default StockStoresView;
