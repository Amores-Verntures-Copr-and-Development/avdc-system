"use client";

import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table from "@/components/shared/Table";
import { Edit, KeyRound, Plus, Radar, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import AddUserModal from "./components/AddUserModal";
import { CreateUserDto, DisplayUserDto } from "@/dtos/user.dto";

import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import toast from "react-hot-toast";
import IconButton from "@/components/shared/IconButton";
import { useSession } from "@/hooks/useSession";
import { formatDateToWords } from "@/utils/formatDateToWords";
import Popup from "@/components/shared/Popup";
import ViewUserModal from "./components/ViewUserModal";
import ExternalDashboardAccessModal from "./components/ExternalDashboardAccessModal";
import ResetPasswordModal from "./components/ResetPasswordModal";
import { ApiResponse } from "@/types/api";
import { StoreInterface } from "@/types/stores";
import { Companies } from "@/types/company";

const companyColumn = {
  name: "Company",
  key: "companyName",
  selector: (row: DisplayUserDto) => row.companyName || "-",
};

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
  {
    name: "Created",
    key: "userCreatedAt",
    selector: (row: DisplayUserDto) => formatDateToWords(row.userCreatedAt),
  },
];

const UserPage = () => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DisplayUserDto | null>(null);
  const [externalDashboardUser, setExternalDashboardUser] =
    useState<DisplayUserDto | null>(null);
  const [resetPasswordUser, setResetPasswordUser] =
    useState<DisplayUserDto | null>(null);
  const [companyFilter, setCompanyFilter] = useState("");
  const { user } = useSession();

  // Gates both External Dashboard Access management and password resets -
  // both hand a user standing access to something (a token, or the account
  // itself), so both are restricted the same way, checked server-side too.
  const isAdminOrOwner =
    user?.userRole === "superadmin" ||
    user?.userRole === "owner" ||
    user?.empPosition === "admin";

  // Every other role is already pinned to their own company server-side
  // (see getUsers in UserControllers.ts) - a company filter only means
  // anything for a superadmin, who otherwise sees every company at once.
  const isSuperAdmin = user?.userRole === "superadmin";

  const { data: companiesResponse } = useSWR<ApiResponse<Companies[]>>(
    isSuperAdmin ? "/api/companies" : null,
    fetcher,
  );
  const companies = companiesResponse?.data ?? [];

  const columns = useMemo(
    () => (isSuperAdmin ? [...userColumn, companyColumn] : userColumn),
    [isSuperAdmin],
  );

  const usersUrl = useMemo(() => {
    if (!isSuperAdmin || !companyFilter) return "/api/users/";

    return `/api/users/?companyId=${companyFilter}`;
  }, [isSuperAdmin, companyFilter]);

  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: DisplayUserDto[] }>(usersUrl, fetcher);

  const { data: storesResponse } = useSWR<ApiResponse<StoreInterface[]>>(
    isAdminOrOwner ? "/api/stores" : null,
    fetcher,
  );
  const stores = useMemo(
    () =>
      (storesResponse?.data ?? [])
        .filter((s): s is StoreInterface & { storeId: number } => !!s.storeId)
        .map((s) => ({
          storeId: s.storeId,
          storeName: s.storeName,
          storeInstallmentEnabled: !!s.storeInstallmentEnabled,
        })),
    [storesResponse],
  );
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
      console.log({ res });
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
      <PageHeader title={"Users"} subtitle="Manage system users" />
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          loading={isLoading}
          showActions
          renderTopActions={
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <div className="w-40">
                  <DropdownSelect
                    name="companyId"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    options={[
                      { value: "", label: "All Companies" },
                      ...companies.map((c) => ({
                        value: String(c.companyId),
                        label: c.companyName,
                      })),
                    ]}
                    sizes="sm"
                  />
                </div>
              )}

              <Button
                icon={Plus}
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
          columns={columns}
          data={response.data}
          totalCount={10}
          showPagination
          uniqueIdKey="userId"
          onRowSelection={(row) => {
            setSelectedUser(row);
          }}
          showCheckBox
          renderActions={(row: DisplayUserDto) => (
            <div className="flex justify-center gap-2">
              {isAdminOrOwner && (
                <IconButton
                  onClick={function (): void {
                    setExternalDashboardUser(row);
                  }}
                  label={"External Dashboard Access"}
                  bg={"gray"}
                  icon={<Radar size={18} />}
                />
              )}
              {isAdminOrOwner && (
                <IconButton
                  onClick={function (): void {
                    setResetPasswordUser(row);
                  }}
                  label={"Reset Password"}
                  bg={"gray"}
                  icon={<KeyRound size={18} />}
                />
              )}
              <IconButton
                onClick={function (): void {
                  console.log(row);
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
      >
        <AddUserModal
          user={user}
          onSubmit={handleAddUser}
          onCancel={() => {
            setShowAddUserModal(false);
          }}
        />
      </Modal>
      <Popup
        title="User Info"
        background="bg-white/40"
        isOpen={selectedUser !== null}
        onClose={function (): void {
          setSelectedUser(null);
        }}
      >
        <ViewUserModal data={selectedUser} user={user} />
      </Popup>
      <Modal
        className="bg-white"
        isOpen={externalDashboardUser !== null}
        title="External Dashboard Access"
        size="md"
        onClose={() => {
          setExternalDashboardUser(null);
        }}
      >
        {externalDashboardUser && (
          <ExternalDashboardAccessModal
            userId={externalDashboardUser.userId}
            userName={externalDashboardUser.fullName}
            stores={stores}
            onClose={() => setExternalDashboardUser(null)}
          />
        )}
      </Modal>
      <Modal
        className="bg-white"
        isOpen={resetPasswordUser !== null}
        title="Reset Password"
        size="sm"
        onClose={() => {
          setResetPasswordUser(null);
        }}
      >
        {resetPasswordUser && (
          <ResetPasswordModal
            userId={resetPasswordUser.userId}
            userName={resetPasswordUser.fullName}
            onClose={() => setResetPasswordUser(null)}
          />
        )}
      </Modal>
    </PageLayout>
  );
};

export default UserPage;
