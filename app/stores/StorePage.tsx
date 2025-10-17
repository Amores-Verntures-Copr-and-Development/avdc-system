"use client";

import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table from "@/components/shared/Table";
import { Edit, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import AddStoreModal from "./components/AddStoreModal";
import { CreateStoreDto } from "@/dtos/store.dto";
import toast from "react-hot-toast";
import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import { StoreInterface } from "@/types/stores";
const storeColumn = [
  { name: "ID", key: "storeId" },
  { name: "Name", key: "storeName" },
  { name: "Location", key: "storeLocation" },
  { name: "Description", key: "storeDescription" },
  { name: "Created", key: "storeCreatedAt" },
];
const StorePage = () => {
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: StoreInterface[] }>("/api/stores/", fetcher);
  const handleSubmit = async (data: CreateStoreDto) => {
    console.log("Data: ", data);
    try {
      const result = await fetch("api/stores", {
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
      toast.success("Store added successfully!");
      mutate();
      return true;
    } catch (e) {
      toast.error("Failed to add user.");
      return false;
    }
  };
  return (
    <PageLayout>
      <PageHeader title={"Stores"} subtitle="Manage your company stores." />
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          renderTopActions={
            <div>
              <Button
                icon={<Plus size={16} />}
                label="Add Store"
                className="font-semibold"
                size="sm"
                onClick={() => {
                  setShowAddStoreModal(true);
                }}
              />
            </div>
          }
          columns={storeColumn}
          loading={isLoading}
          data={response.data}
          showActions
          maxHeight="h-full"
          totalCount={10}
          renderActions={(row: any) => (
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
                  throw new Error("Function not implemented.");
                }}
                label={"Delete"}
                bg={"red"}
                icon={<Trash2 size={18} />}
              />
            </div>
          )}
          showCheckBox
          searchUrl="/stores"
        />
      </div>
      <Modal
        title="Add Store"
        className="bg-white"
        isOpen={showAddStoreModal}
        onClose={() => {
          setShowAddStoreModal(false);
        }}
        children={
          <AddStoreModal
            onCancel={() => {
              setShowAddStoreModal(false);
            }}
            onSubmit={handleSubmit}
          />
        }
      />
    </PageLayout>
  );
};

export default StorePage;
