"use client";

import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table from "@/components/shared/Table";
import { Edit, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import AddCategoryModal from "./components/AddCategoryModal";
import { CreateCategoryDto, DisplayCategoryDto } from "@/dtos/category.dto";
import { fetcher } from "@/utils/fetcher";
import toast from "react-hot-toast";
import useSWR from "swr";
import IconButton from "@/components/shared/IconButton";

const categoriesColumn = [
  { name: "ID", key: "categoryId" },
  { name: "Name", key: "categoryName" },
  { name: "Type", key: "categoryType" },
  { name: "Store", key: "storeId" },
  { name: "Created", key: "categoryCreatedAt" },
];
const CategoryPage = () => {
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const {
    data: response = { data: [] },

    mutate,
  } = useSWR<{ data: DisplayCategoryDto[] }>("/api/categories/", fetcher);
  const handleSubmit = async (data: CreateCategoryDto): Promise<boolean> => {
    try {
      const result = await fetch("api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
    <PageLayout>
      <PageHeader
        title={"Categories"}
        subtitle="Manage your categories for your items."
      />
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          renderTopActions={
            <>
              <div>
                <Button
                  icon={<Plus size={17} />}
                  label="Add Category"
                  onClick={() => {
                    setShowAddCategoryModal(true);
                  }}
                  size="sm"
                  className="font-semibold"
                />
              </div>
            </>
          }
          showActions
          columns={categoriesColumn}
          data={response.data}
          totalCount={10}
          maxHeight="h-full"
          renderActions={(row: DisplayCategoryDto) => (
            <div className="flex justify-center gap-2">
              <IconButton
                onClick={function (): void {
                  throw new Error("Function not implemented.");
                }}
                label={"Edit"}
                bg={"gray"}
                icon={<Edit size={18} />}
              />
              <IconButton
                onClick={function (): void {
                  console.log(row);
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
    </PageLayout>
  );
};

export default CategoryPage;
