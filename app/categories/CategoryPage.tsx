"use client";

import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { Edit, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import AddCategoryModal from "./components/AddCategoryModal";
import { CreateCategoryDto } from "@/dtos/category.dto";
import { fetcher } from "@/utils/fetcher";
import toast from "react-hot-toast";
import useSWR from "swr";
import IconButton from "@/components/shared/IconButton";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { useSession } from "@/hooks/useSession";
import { CategoryInterface } from "@/types/categories";
import { useStockRoom } from "@/hooks/useStockRoom";
import { ApiResponse } from "@/types/api";
import EditCategoryModal from "./components/EditCategoryModal";
import DeleteCategoryModal from "./components/DeleteCategoryModal";

const categoriesColumn: Column<CategoryInterface>[] = [
  { name: "#", key: "#", selector: (row, index) => index + 1 },
  { name: "Name", key: "categoryName" },
  { name: "Type", key: "categoryType" },
  { name: "Store", key: "storeId" },
  {
    name: "Created",
    key: "categoryCreatedAt",
    selector: (row) => formatDateToWords(row.categoryCreatedAt),
  },
];
const CategoryPage = () => {
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] =
    useState<CategoryInterface | null>(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] =
    useState<CategoryInterface | null>(null);
  const { user, hasStore } = useSession();
  const { stockRoom } = useStockRoom(
    user?.empPosition === "admin" || user?.empPosition === "purchaser"
      ? user?.userId
      : null,
  );
  // const { stores } = useStores({ user, hasStore, isAdmin });
  const categoriesUrl =
    user?.userRole === "employee" &&
    (user?.empPosition === "admin" || user?.empPosition === "purchaser")
      ? `api/categories/stock-room/${stockRoom?.stockRoomId}`
      : hasStore
        ? `api/categories/stores/${user?.storeId}`
        : `api/categories/`;
  const { data: response, mutate } = useSWR<ApiResponse<CategoryInterface[]>>(
    user ? categoriesUrl : null,
    fetcher,
  );

  const handleSubmit = async (data: CreateCategoryDto): Promise<boolean> => {
    const newData: CreateCategoryDto = {
      ...data,
      categoryReferenceType: stockRoom ? "stock-room" : "stores",
      categoryReferenceId: stockRoom
        ? stockRoom.stockRoomId
        : (user?.storeId ?? 0),
    };
    console.log("New Data: ", newData);
    console.log({ stockRoom, userStoreId: user?.storeId });
    try {
      const result = await fetch("api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success("User added successfully!");
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add user.");
      return false;
    }
  };

  return (
    <PageLayout className="p-2 gap-2">
      <PageHeader
        title={"Categories"}
        subtitle="Manage your categories for your items."
      />
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          showPagination
          uniqueIdKey="categoryId"
          renderTopActions={
            <>
              <div>
                <Button
                  icon={Plus}
                  label="Add Category"
                  onClick={() => {
                    setShowAddCategoryModal(true);
                  }}
                  size="xs"
                  className="font-semibold"
                />
              </div>
            </>
          }
          showActions
          columns={categoriesColumn}
          data={response?.data ?? []}
          totalCount={10}
          maxHeight="h-full"
          renderActions={(row: CategoryInterface) => (
            <div className="flex justify-center gap-2">
              <IconButton
                onClick={function (): void {
                  setShowEditCategoryModal(row);
                }}
                label={"Edit"}
                bg={"gray"}
                icon={<Edit size={18} />}
              />
              <IconButton
                onClick={function (): void {
                  setShowDeleteCategoryModal(row);
                }}
                label={"Delete"}
                bg={"red"}
                icon={<Trash2 size={18} />}
              />
            </div>
          )}
        />
      </div>
      <Modal
        className="bg-white"
        title="Add Category"
        isOpen={showAddCategoryModal}
        onClose={() => {
          setShowAddCategoryModal(false);
        }}
      >
        <AddCategoryModal
          onCancel={() => {
            setShowAddCategoryModal(false);
          }}
          onSubmit={handleSubmit}
        />
      </Modal>
      <Modal
        isOpen={showEditCategoryModal !== null}
        onClose={function (): void {
          setShowEditCategoryModal(null);
        }}
        title={`Edit Category - ${showEditCategoryModal?.categoryName}`}
      >
        <EditCategoryModal
          data={showEditCategoryModal}
          mutate={mutate}
          onCancel={() => setShowEditCategoryModal(null)}
        />
      </Modal>
      <Modal
        isOpen={showDeleteCategoryModal !== null}
        onClose={function (): void {
          setShowDeleteCategoryModal(null);
        }}
        title={`Delete Category - ${showDeleteCategoryModal?.categoryName}`}
      >
        <DeleteCategoryModal
          data={showDeleteCategoryModal}
          mutate={mutate}
          onCancel={() => setShowDeleteCategoryModal(null)}
        />
      </Modal>
    </PageLayout>
  );
};

export default CategoryPage;
