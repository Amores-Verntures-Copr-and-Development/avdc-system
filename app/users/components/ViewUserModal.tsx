import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";
import SectionHeader from "@/components/shared/SectionHeader";
import { DisplayUserInfoDto, UpdateUserInfoDto } from "@/dtos/user.dto";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { handleChange } from "@/utils/handle-change";
import {
  AtSign,
  Briefcase,
  Calendar,
  Check,
  Mail,
  Pencil,
  ShieldCheck,
  Store,
  User as UserIcon,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import EditEmployeeModal from "./EditEmployeeModal";
import { EmployeeInterface } from "@/types/employees";
import { CreateStoreEmployeeDto } from "@/dtos/store.dto";
import toast from "react-hot-toast";
import { UserAuth } from "@/hooks/useSession";

interface ViewUserModalProps {
  data: { userId: number | null } | null;
  user: UserAuth | null;
}

const roleLabelMap: Record<string, string> = {
  superadmin: "Super Admin",
  owner: "Owner",
  employee: "Employee",
};

const ViewUserModal = ({ data, user }: ViewUserModalProps) => {
  const [formData, setFormData] = useState<DisplayUserInfoDto | null>(null);
  const [isEditingUserInfo, setIsEditingUserInfo] = useState(false);
  const [isSavingUserInfo, setIsSavingUserInfo] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [isAssignStores, setIsAssignStores] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeInterface | null>(
    null,
  );
  const handleEditEmployee = () => {
    if (!formData) {
      return;
    }
    const employee: EmployeeInterface = {
      userId: formData?.userId ?? 0,
      empId: formData?.empId ?? 0,
      empPosition: formData?.empPosition,
      empCreatedAt: formData?.empCreatedAt ?? "",
      empUpdatedAt: formData?.empUpdatedAt ?? "",
      storeEmployees:
        formData?.storeEmployees?.map((store) => ({
          ...store,
        })) ?? [],
    };
    setEmployeeData(employee);
  };

  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: DisplayUserInfoDto[] }>(
    data ? `/api/users/${data.userId}` : null,
    fetcher,
  );
  useEffect(() => {
    if (response.data && response.data.length > 0) {
      setFormData(response.data[0]);
    }
  }, [data, response.data]);
  const handUserChange = handleChange(formData, setFormData);

  const handleCancelEditUserInfo = () => {
    if (response.data && response.data.length > 0) {
      setFormData(response.data[0]);
    }
    setIsEditingUserInfo(false);
  };

  const handleSaveUserInfo = async () => {
    if (!formData || !data?.userId) return;

    if (!formData.userFname?.trim() || !formData.userLname?.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    const payload: UpdateUserInfoDto = {
      userFname: formData.userFname,
      userMname: formData.userMname,
      userLname: formData.userLname,
      userEmail: formData.userEmail,
    };

    setIsSavingUserInfo(true);
    try {
      const res = await fetch(`/api/users/${data.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message || "User information updated!");
      mutate();
      setIsEditingUserInfo(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update user information.");
    } finally {
      setIsSavingUserInfo(false);
    }
  };

  const handleSaveAssignStores = async (store: CreateStoreEmployeeDto[]) => {
    const newData: CreateStoreEmployeeDto[] = store.map((store) => ({
      ...store,
      storeEmpCreatedBy: user?.userId ?? 0,
    }));
    setIsAssignStores(true);
    try {
      const result = await fetch(
        `/api/stores/userId/${data?.userId}/store-employee/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newData),
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
    } catch (e) {
      console.log(e);
      toast.error("Failed to edit employee.");
      return false;
    } finally {
      setIsAssignStores(false);
    }
  };
  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto">
      {isLoading ? (
        <LoaderComponent />
      ) : (
        <>
          <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <SectionHeader
                icon={UserIcon}
                title="User Information"
                subtitle="Core account details for this user."
              />

              {isEditingUserInfo ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="xs"
                    color="secondary"
                    label="Cancel"
                    icon={X}
                    className="w-auto px-3"
                    onClick={handleCancelEditUserInfo}
                    disabled={isSavingUserInfo}
                  />
                  <Button
                    size="xs"
                    label="Save"
                    icon={Check}
                    className="w-auto px-3"
                    onClick={handleSaveUserInfo}
                    loading={isSavingUserInfo}
                  />
                </div>
              ) : (
                <Button
                  size="xs"
                  color="secondary"
                  hasBorder
                  label="Edit"
                  icon={Pencil}
                  className="w-auto shrink-0 px-3"
                  onClick={() => setIsEditingUserInfo(true)}
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                name="userFname"
                value={formData?.userFname ?? ""}
                sizes="xs"
                onChange={handUserChange}
                disabled={!isEditingUserInfo}
                leadingIcon={<UserIcon className="h-3.5 w-3.5" />}
              />
              <Input
                label="Middle Name"
                name="userMname"
                value={formData?.userMname ?? ""}
                sizes="xs"
                onChange={handUserChange}
                disabled={!isEditingUserInfo}
                leadingIcon={<UserIcon className="h-3.5 w-3.5" />}
              />
              <Input
                label="Last Name"
                name="userLname"
                value={formData?.userLname ?? ""}
                sizes="xs"
                onChange={handUserChange}
                disabled={!isEditingUserInfo}
                leadingIcon={<UserIcon className="h-3.5 w-3.5" />}
              />
              <Input
                label="Email"
                name="userEmail"
                value={formData?.userEmail ?? ""}
                sizes="xs"
                onChange={handUserChange}
                disabled={!isEditingUserInfo}
                leadingIcon={<Mail className="h-3.5 w-3.5" />}
              />
            </div>

            {/* Fields below are never editable from here - identity/role
                and audit timestamps aren't part of a basic info edit. */}
            <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
              <Input
                label="Username"
                name="userId"
                value={formData?.userId ?? ""}
                disabled
                sizes="xs"
                leadingIcon={<AtSign className="h-3.5 w-3.5" />}
              />
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-gray-700 xl:text-xs">
                  Role
                </label>
                <div className="flex h-8 items-center rounded-md border border-gray-200 bg-gray-50 px-2.5">
                  <ShieldCheck className="mr-2 h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-700">
                    {roleLabelMap[formData?.userRole ?? ""] ??
                      formData?.userRole ??
                      "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created {formatDateToWords(formData?.userCreatedAt ?? "")}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Updated {formatDateToWords(formData?.userUpdatedAt ?? "")}
              </span>
              <span className="ml-auto font-medium text-gray-500">
                Status: {formData?.userStatus ?? "-"}
              </span>
            </div>
          </div>

          {formData?.empId && (
            <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <SectionHeader
                  icon={Briefcase}
                  title="Employee Information"
                  subtitle="Position and store assignments."
                />
                <Button
                  size="xs"
                  color="secondary"
                  hasBorder
                  label="Edit"
                  icon={Pencil}
                  className="w-auto shrink-0 px-3"
                  onClick={() => {
                    setShowEditEmployee(true);
                    handleEditEmployee();
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Employee ID"
                  name="empId"
                  value={formData?.empId ?? ""}
                  disabled
                  sizes="xs"
                />
                <Input
                  label="Position"
                  name="empPosition"
                  value={formData?.empPosition ?? ""}
                  disabled
                  sizes="xs"
                  leadingIcon={<Briefcase className="h-3.5 w-3.5" />}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-gray-700 xl:text-xs">
                  Assigned Stores
                </label>
                {formData?.storeEmployees &&
                formData.storeEmployees.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.storeEmployees.map((store) => (
                      <span
                        key={store.storeId}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700"
                      >
                        <Store className="h-3 w-3 text-gray-400" />
                        {store.storeName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No stores assigned.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
      <Modal
        size="lg"
        title="Edit Employee"
        isOpen={showEditEmployee}
        onClose={function (): void {
          setShowEditEmployee(false);
          setEmployeeData(null);
        }}
      >
        <EditEmployeeModal
          data={employeeData}
          onSaveStoreEmployee={handleSaveAssignStores}
          onClose={() => {
            setShowEditEmployee(false);
          }}
          isLoadingAssign={isAssignStores}
        />
      </Modal>
    </div>
  );
};

export default ViewUserModal;
