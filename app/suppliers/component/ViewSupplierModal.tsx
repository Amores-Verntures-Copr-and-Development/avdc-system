import Button from "@/components/shared/Button";
import Popup from "@/components/shared/PopupModal";
import Table, { Column } from "@/components/shared/Table";
import {
  CreateSupplierItemDto,
  DisplaySupplierItemDto,
} from "@/dtos/supplier.dto";
import { Supplier } from "@/types/supplier";
import { PackagePlusIcon } from "lucide-react";
import React, { useState } from "react";
import AddItemToSupplierModal from "./AddItemToSupplierModal";
import { UserAuth } from "@/hooks/useSession";
import toast from "react-hot-toast";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";

interface ViewSupplierModalProps {
  data: Supplier | null;
  user: UserAuth | null;
}
const supplierItemColumn: Column<DisplaySupplierItemDto>[] = [
  { name: "Name", key: "itemName" },
  { name: "Unit", key: "itemUnit" },
  { name: "Category", key: "categoryName" },
  { name: "Price", key: "suppItemPrice" },
];
const ViewSupplierModal: React.FC<ViewSupplierModalProps> = ({
  data,
  user,
}) => {
  const [showAddItem, setShowAddItem] = useState(false);
  const { data: itemResponse = { data: [] }, mutate } = useSWR<{
    data: DisplaySupplierItemDto[];
  }>(
    data?.suppId ? `/api/suppliers/supplier-items/${data?.suppId}` : null,
    fetcher
  );
  const handleAddItemToSupplier = async (dataItem: CreateSupplierItemDto) => {
    console.log("Supplier: ", data);
    const newData: CreateSupplierItemDto = {
      ...dataItem,
      suppItemCreatedBy: user?.userId ?? 0,
      suppId: data?.suppId ?? 0,
    };
    if (!data?.suppId) {
      console.log("newData: ", newData);
      toast.error("No supplier id!");
      return false;
    }

    try {
      console.log("CreateFirstItem: ", newData);
      const result = await fetch(`api/suppliers/supplier-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      return true;
    } catch (e: any) {
      console.log(e);
      toast.error("Failed to add item in supplier");
      return false;
    }
  };
  return (
    <div className="flex flex-col">
      <Table
        renderTopActions={
          <div>
            <Button
              size="sm"
              icon={<PackagePlusIcon size={20} />}
              label="Add Item"
              onClick={function (): void {
                setShowAddItem(true);
              }}
            />
          </div>
        }
        columns={supplierItemColumn}
        data={itemResponse.data}
      />
      <Popup
        title="Add Item to store"
        background="transparent"
        isOpen={showAddItem}
        onClose={function (): void {
          setShowAddItem(false);
        }}
      >
        <AddItemToSupplierModal
          data={data}
          onCancel={function (): void {
            setShowAddItem(false);
          }}
          onSubmit={handleAddItemToSupplier}
        />
      </Popup>
    </div>
  );
};

export default ViewSupplierModal;
