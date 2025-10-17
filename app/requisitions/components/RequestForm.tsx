import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import Popup from "@/components/shared/Popup";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayRequestItems,
  DisplayRequestOrderDto,
} from "@/dtos/request.dto";
import { useSession } from "@/hooks/useSession";
import { fetcher } from "@/utils/fetcher";
import { ArrowLeft, Edit, Plus, PlusSquare, Trash2 } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";

interface RequestItem {
  id: number;
  itemName: string;
  description: string;
  quantity: number;
  received?: number;
}
interface RequestFormProps {
  selectedRow: DisplayRequestOrderDto | null;
  setSelectedRow: (data: DisplayRequestOrderDto | null) => void;
}

const requestItemColumn: Column<DisplayRequestItems>[] = [
  { name: "ID", key: "reqItemId" },
  { name: "Name", key: "itemName" },
  { name: "Unit", key: "itemUnit" },
  { name: "Quantity", key: "reqItemQuantity" },
  { name: "Received", key: "reqItemReceived" },
];
const RequestForm: React.FC<RequestFormProps> = ({
  selectedRow,
  setSelectedRow,
}) => {
  const { user } = useSession();
  const [isShowAddModal, setIsShowAddModal] = useState(false);
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: DisplayRequestItems[] }>(
    user ? `/api/request/request-items/${selectedRow?.requestId}` : null,
    fetcher
  );
  console.log("itemResponse: ", itemResponse);
  return (
    <div className="h-full bg-white rouded flex flex-col">
      <div className="border-b border-gray-200 justify-between flex flex-col pl-5 pr-5 pt-5">
        <div>
          <IconButton
            onClick={() => {
              setSelectedRow(null);
            }}
            label={"Back"}
            bg={"gray"}
            icon={<ArrowLeft />}
          />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="flex flex-col flex-1 flex-wrap justify-between">
            <span className="text-md font-semibold mb-2">
              {selectedRow?.requestNo}
            </span>
            <span className="text-xs font-medium">
              Created: {selectedRow?.requestCreatedAt}
            </span>
            <span className="text-xs font-medium">
              Requested By: {selectedRow?.requestedByName}
            </span>
          </div>
          <div className="flex items-start align-top">
            <span className="text-sm font-semibold">
              {selectedRow?.requestStatus}
            </span>
          </div>
        </div>
        {/* <button
          onClick={() => {
            setIsShowAddModal(true);
          }}
          className="px-2 py-2 rounded bg-primary-1 text-white hover:bg-primary-1-hover"
        >
          <div className="flex items-center gap-2">
            <Plus size={18} />
            <span className="font-semibold text-xs">Item</span>
          </div>
        </button> */}
      </div>
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          columns={requestItemColumn}
          loading={loading}
          data={itemResponse.data}
          showActions
          renderActions={(row, rowIndex) => (
            <div className="flex justify-center gap-2">
              <IconButton
                onClick={() => {
                  console.log("Edit Index: ", { rowIndex, row });
                }}
                label={"Edit"}
                bg={"blue"}
                icon={<Edit size={18} />}
              />
              <IconButton
                onClick={function (): void {
                  throw new Error("Function not implemented.");
                }}
                label={"Delete"}
                bg={"red"}
                icon={<Trash2 size={18} />}
              />
            </div>
          )}
        />
      </div>
      <Popup
        background="bg-white/5"
        title="Add Item Request"
        isOpen={isShowAddModal}
        onClose={() => {
          setIsShowAddModal(false);
        }}
        position="right"
      >
        <div></div>
      </Popup>
    </div>
  );
};

export default RequestForm;
