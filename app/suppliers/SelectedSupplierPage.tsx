import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Popup from "@/components/shared/PopupModal";
import Table, { Column } from "@/components/shared/Table";
import {
  CreateSupplierItemDto,
  DisplaySupplierItemDto,
} from "@/dtos/supplier.dto";
import { Supplier, SupplierItem } from "@/types/supplier";
import { fetcher } from "@/utils/fetcher";
import {
  BarChart3,
  DollarSign,
  Eye,
  LogOut,
  PackagePlusIcon,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import AddItemToSupplierModal from "./component/AddItemToSupplierModal";
import toast from "react-hot-toast";
import { UserAuth } from "@/hooks/useSession";
import Card from "@/components/shared/Card";
import { useSearchParams } from "next/navigation";
import ViewSupplierItemModa from "./component/ViewSupplierItemModal";
interface SelectedSupplierPageProps {
  data: Supplier | null;
  onBack: () => void;
  user: UserAuth | null;
}
const supplierItemColumn: Column<DisplaySupplierItemDto>[] = [
  { name: "Name", key: "itemName" },
  { name: "Unit", key: "itemUnit" },
  { name: "Category", key: "categoryName" },
  { name: "Price", key: "suppItemPrice" },
];
const SelectedSupplierPage = ({
  data,
  onBack,
  user,
}: SelectedSupplierPageProps) => {
  const searchParams = useSearchParams();
  const [showDeleteModal, setShowDeleteModal] = useState<"row" | "rows" | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<DisplaySupplierItemDto[]>();
  const [selectedRow, setSelectedRow] = useState<DisplaySupplierItemDto | null>(
    null,
  );
  const [showAddItem, setShowAddItem] = useState(false);
  const [showViewItem, setShowViewItem] = useState(false);
  const url = `/api/suppliers/supplier-items/${data?.suppId}`;
  const getApiUrl = () => {
    if (!data) return null;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const unit = searchParams.get("unit") || "";

    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (unit) params.append("unit", unit);

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  };
  const {
    data: itemResponse = { data: [] },
    mutate,
    isLoading,
  } = useSWR<{
    data: DisplaySupplierItemDto[];
  }>(getApiUrl(), fetcher);
  const handleSelectionChange = (selected: DisplaySupplierItemDto[]) => {
    // 👉 Here you can trigger bulk delete, bulk approve, etc.
    if (selected.length > 0) {
      setSelectedRows(selected);
    }
    if (selected.length === 0) {
      setSelectedRows(undefined);
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
        },
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
      console.log({ e });
      toast.error("Failed to remove!");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };
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
  const handleUpdateData = async () => {
    const updatedData = await mutate();
    // The updatedData should contain the fresh data
    const findSelectedRow = updatedData?.data.find(
      (item) => item.suppItemId === selectedRow?.suppItemId,
    );
    if (findSelectedRow) {
      setSelectedRow(findSelectedRow);
    }
  };
  return (
    <PageLayout className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        {" "}
        <PageHeader title={data?.suppName ?? ""} subtitle="Suppliers" />
        <div>
          <Button
            size="xs"
            icon={LogOut}
            label="Back"
            color="secondary"
            onClick={onBack}
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Card
          title={"Total Spend"}
          value={0}
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-green-100 text-green-600"
        />
        <Card
          title={"Total Orders"}
          value={42}
          icon={<ShoppingCart className="h-5 w-5" />}
          iconBg="bg-purple-100 text-purple-600"
        />
        <Card
          title={"Monthly Avg."}
          value={10416}
          icon={<BarChart3 className="h-5 w-5" />}
          iconBg="bg-yellow-100 text-yellow-600"
        />
        <Card
          title={"Total Items"}
          value={0}
          icon={<BarChart3 className="h-5 w-5" />}
          iconBg="bg-pink-100 text-pink-600"
        />
      </div>
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          searchUrl="/suppliers"
          totalCount={itemResponse.data.length}
          showPagination
          maxHeight="h-full"
          loading={isLoading}
          uniqueIdKey="suppItemId"
          renderTopActions={
            <div>
              {selectedRows && selectedRows?.length > 0 ? (
                <div>
                  <Button
                    size="xs"
                    icon={Trash2}
                    label="Remove Item"
                    onClick={function (): void {
                      setShowDeleteModal("rows");
                    }}
                    color="danger"
                  />
                </div>
              ) : (
                <div>
                  <Button
                    size="xs"
                    icon={PackagePlusIcon}
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
          onRowSelection={(row) => {
            setShowViewItem(true);
            setSelectedRow(row);
          }}
          onSelectionChange={handleSelectionChange}
          renderActions={(row) => (
            <div className="flex gap-2 justify-center">
              {/* View Button */}
              <IconButton
                onClick={() => {
                  setShowViewItem(true);
                  setSelectedRow(row);
                }}
                label={"View"}
                bg={"gray"}
                icon={<Eye size={18} />}
              />
              <IconButton
                onClick={() => {
                  setShowDeleteModal("row");
                  setSelectedRow(row);
                }}
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
        <Popup
          title="Supplier Item"
          background="transparent"
          isOpen={showViewItem}
          onClose={function (): void {
            setShowViewItem(false);
          }}
        >
          <ViewSupplierItemModa
            data={selectedRow}
            user={user}
            mutateSupplierItem={handleUpdateData}
            handleRemoveItemFromSupplier={handleRemoveItemFromSupplier}
            isDeleting={isDeleting}
            suppData={data}
            onClose={function (): void {
              setShowViewItem(false);
            }}
          />
        </Popup>
        <Modal
          title={`Remove ${data?.suppName}'s items`}
          isOpen={showDeleteModal !== null}
          onClose={function (): void {
            setShowDeleteModal(null);
          }}
        >
          {showDeleteModal === "rows" ? (
            <div className="space-y-4">
              {" "}
              <div className="text-center">
                Are you sure you want to remove{" "}
                <span className="font-semibold">{selectedRows?.length}</span>{" "}
                item(s) from {data?.suppName}?
              </div>
              <div className="flex justify-end gap-4">
                <div>
                  <Button size="sm" label="Cancel" color="secondary" />
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
                      const success =
                        await handleRemoveItemFromSupplier(selectedRows);
                      if (success) {
                        setShowDeleteModal(null);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {" "}
              <div className="text-center">
                Are you sure you want to remove{" "}
                <span className="font-semibold">{selectedRow?.itemName}</span>{" "}
                item(s) from {data?.suppName}?
              </div>
              <div className="flex justify-end gap-4">
                <div>
                  <Button size="sm" label="Cancel" color="secondary" />
                </div>
                <div>
                  <Button
                    size="sm"
                    label="Remove"
                    loading={isDeleting}
                    onClick={async () => {
                      if (!selectedRow) {
                        return;
                      }
                      const success = await handleRemoveItemFromSupplier([
                        selectedRow,
                      ]);
                      if (success) {
                        setShowDeleteModal(null);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageLayout>
  );
};

export default SelectedSupplierPage;
