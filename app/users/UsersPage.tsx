"use client";

import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table from "@/components/shared/Table";
import { Edit, Plus, Trash, Trash2 } from "lucide-react";
import React, { use, useState } from "react";
import AddUserModal from "./components/AddUserModal";
import { CreateUserDto, DisplayUserDto } from "@/dtos/user.dto";
import { UserInterface } from "@/types/users";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import toast from "react-hot-toast";
import IconButton from "@/components/shared/IconButton";
import { useSession } from "@/hooks/useSession";

const userColumn = [
  { name: "ID", key: "userId" },
  {
    name: "Name",
    key: "userFname",
    selector: (row: DisplayUserDto) => `${row.userFname} ${row.userLname}`,
  },
  { name: "Role", key: "userRole" },
  { name: "Email", key: "userEmail" },
  { name: "Position", key: "empPosition" },
  { name: "Status", key: "status" },
  { name: "Added By", key: "addedBy" },
  { name: "Store", key: "storeId" },
  { name: "Created", key: "userCreatedAt" },
];

const UserPage = () => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const { user } = useSession();

  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: DisplayUserDto[] }>("/api/users/", fetcher);
  const handleAddUser = async (data: CreateUserDto) => {
    if (!user) {
      toast.error("No user ID found!");
    }
    const newData: CreateUserDto = {
      ...data,
      userAddedBy: user?.userId ?? 0,
    };
    try {
      const result = await fetch("api/users", {
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
      toast.error("Failed to add user.");
      return false;
    }
  };
  return (
    <PageLayout>
      <PageHeader title={"Users"} subtitle="Manage system users" />
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          loading={isLoading}
          showActions
          renderTopActions={
            <div>
              <Button
                icon={<Plus size={16} />}
                label="Add User"
                className="font-semibold"
                size="sm"
                onClick={() => {
                  setShowAddUserModal(true);
                }}
              />
            </div>
          }
          searchUrl="/users"
          maxHeight="h-full"
          columns={userColumn}
          data={response.data}
          totalCount={10}
          showCheckBox
          renderActions={(row: DisplayUserDto) => (
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
        />
      </div>
      <Modal
        className="bg-white"
        isOpen={showAddUserModal}
        title="Add User"
        size="lg"
        onClose={() => {
          setShowAddUserModal(false);
        }}
        children={
          <AddUserModal
            user={user}
            onSubmit={handleAddUser}
            onCancel={() => {
              setShowAddUserModal(false);
            }}
          />
        }
      />
    </PageLayout>
  );
};

export default UserPage;
