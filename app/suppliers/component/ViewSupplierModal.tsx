import Button from "@/components/shared/Button";
import Popup from "@/components/shared/PopupModal";
import Table, { Column } from "@/components/shared/Table";
import {
  CreateSupplierItemDto,
  DisplaySupplierItemDto,
} from "@/dtos/supplier.dto";
import { Supplier, SupplierItem } from "@/types/supplier";
import { Eye, PackagePlusIcon, Trash2 } from "lucide-react";
import React, { useState } from "react";
import AddItemToSupplierModal from "./AddItemToSupplierModal";
import { UserAuth } from "@/hooks/useSession";
import toast from "react-hot-toast";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<DisplaySupplierItemDto[]>();
  const {
    data: itemResponse = { data: [] },
    mutate,
    isLoading,
  } = useSWR<{
    data: DisplaySupplierItemDto[];
  }>(
    data?.suppId ? `/api/suppliers/supplier-items/${data?.suppId}` : null,
    fetcher
  );
  const handleAddItemToSupplier = async (dataItem: CreateSupplierItemDto) => {
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
  const handleRemoveItemFromSupplier = async (item: SupplierItem[]) => {
    setIsDeleting(true);
    try {
      const apiBody = {
        controller: "delete",
        data: item,
      };

      const result = await fetch(
        `api/suppliers/supplier-items/${data?.suppId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiBody),
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
    } catch (e: any) {
      console.log(e);
      toast.error("Failed to remove!");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectionChange = (selected: DisplaySupplierItemDto[]) => {
    // 👉 Here you can trigger bulk delete, bulk approve, etc.
    if (selected.length > 0) {
      setSelectedRows(selected);
    }
    if (selected.length === 0) {
      setSelectedRows(undefined);
    }
  };
  return (
    <div className="flex-1 min-h-0  flex flex-col justify-between">
      <Table
        maxHeight="h-full"
        loading={isLoading}
        renderTopActions={
          <div>
            {selectedRows && selectedRows?.length > 0 ? (
              <div>
                <Button
                  size="sm"
                  icon={<Trash2 size={20} />}
                  label="Remove Item"
                  onClick={function (): void {
                    setShowDeleteModal(true);
                  }}
                  color="danger"
                />
              </div>
            ) : (
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
            )}
          </div>
        }
        columns={supplierItemColumn}
        data={itemResponse.data}
        showCheckBox
        showActions
        onSelectionChange={handleSelectionChange}
        renderActions={(row) => (
          <div className="flex gap-2 justify-center">
            {/* View Button */}
            <IconButton
              onClick={() => {
                console.log({ row });
                // setShowViewSupplier(true);
                // setSelectedSupplier(row);
              }}
              label={"View"}
              bg={"gray"}
              icon={<Eye size={18} />}
            />
            <IconButton
              onClick={() => {}}
              label={"Remove"}
              bg={"red"}
              icon={<Trash2 size={18} />}
            />
          </div>
        )}
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
      <Modal
        title={`Remove ${data?.suppName}'s items`}
        isOpen={showDeleteModal}
        onClose={function (): void {
          setShowDeleteModal(false);
        }}
      >
        <div className="space-y-4">
          {" "}
          <div className="text-center">
            Are you sure you want to remove {selectedRows?.length} item(s) from{" "}
            {data?.suppName}?
          </div>
          <div className="flex justify-end gap-4">
            <div>
              <Button size="sm" label="Cancel" color="nocolor" />
            </div>
            <div>
              <Button
                size="sm"
                label="Remove"
                loading={isDeleting}
                onClick={async () => {
                  if (!selectedRows) {
                    return;
                  }
                  const success = await handleRemoveItemFromSupplier(
                    selectedRows
                  );
                  if (success) {
                    setShowDeleteModal(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ViewSupplierModal;
