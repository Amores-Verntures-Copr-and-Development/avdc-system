import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import { StockRoom, StockStores } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import { Plus, Trash } from "lucide-react";
import React, { useState } from "react";
import AddStoreToStockRoomModal from "../component/AddUserToStockRoomModal";
import {
  CreateStockRoomUserDTO,
  CreateStockStore,
  DisplayStockRoomUserDTO,
} from "@/dtos/stockRoom.dto";
import { UserAuth } from "@/hooks/useSession";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import toast from "react-hot-toast";
import { formatDateToWords } from "@/utils/formatDateToWords";
import IconButton from "@/components/shared/IconButton";
import ConfirmationModal from "@/components/shared/ConfirmationModal";

interface DisplayStores extends StoreInterface, StockStores {}

const columns: Column<DisplayStockRoomUserDTO>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "srUserName", name: "Name" },
  { key: "srAddedByName", name: "Added By" },
  {
    key: "srUserCreatedAt",
    name: "Created At",
    selector: (row) => formatDateToWords(row.srUserCreatedAt),
  },
];
interface StockStoresViewProps {
  data: StockRoom;
  user: UserAuth | null;
}
const StockUsersView = ({ data, user }: StockStoresViewProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRow, setSelectedRow] =
    useState<DisplayStockRoomUserDTO | null>(null);
  const [showModal, setShowModal] = useState<"delete" | null>(null);
  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: DisplayStockRoomUserDTO[] }>(
    `/api/stock-room/${data.stockRoomId}/user`,
    fetcher,
  );
  const handleAddUser = async (dataStore: CreateStockRoomUserDTO[]) => {
    setIsSubmitting(true);
    try {
      const result = await fetch(`/api/stock-room/${data.stockRoomId}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataStore),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = async () => {
    setIsSubmitting(true);
    try {
      if (!selectedRow) {
        toast.error("No selected user to be remove!");
        return;
      }

      const res = await fetch(
        `/api/stock-room/[${selectedRow.stockRoomId}]/user/${selectedRow.srUserId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) {
        throw new Error("Failed to user in stock room!");
      }
      const result = await res.json();
      mutate();
      toast.success(result.message);
      setSelectedRow(null);
      setShowModal(null);
    } catch (e) {
      toast.error("Failed to remove user in stock room!");
    } finally {
      setIsSubmitting(false);
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
                icon={Plus}
                size="xs"
                label="Add User"
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
        showPagination
        maxHeight="h-full"
        showActions
        renderActions={(row) => (
          <div>
            <IconButton
              onClick={function (): void {
                setSelectedRow(row);
                setShowModal("delete");
              }}
              icon={<Trash className="w-4 h-4" />}
              label={"Remove User"}
              bg={"red"}
            />
          </div>
        )}
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
          onSubmit={handleAddUser}
        />
      </Modal>
      <ConfirmationModal
        onConfirm={function (): void {
          handleRemoveUser();
        }}
        confirmationInfo={`Are you sure you want to remove ${selectedRow?.srUserName} from ${data.stockRoomName}?`}
        onClose={function (): void {
          setShowModal("delete");
          setSelectedRow(null);
        }}
        isShow={showModal === "delete" && selectedRow !== null}
        isLoading={isSubmitting}
      />
    </>
  );
};

export default StockUsersView;
