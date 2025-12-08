import BigCard from "@/components/shared/BigCard";

import IconButton from "@/components/shared/IconButton";
import Input from "@/components/shared/Input";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";
import { DisplayUserDto, DisplayUserInfoDto } from "@/dtos/user.dto";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { handleChange } from "@/utils/handle-change";
import { Edit } from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import EditEmployeeModal from "./EditEmployeeModal";
import { EmployeeInterface } from "@/types/employees";
import { CreateStoreEmployeeDto } from "@/dtos/store.dto";
import toast from "react-hot-toast";
import { UserAuth } from "@/hooks/useSession";
interface ViewUserModalProps {
  data: DisplayUserDto | null;
  user: UserAuth | null;
}
// app/api/users/[userId]/route.ts
const ViewUserModal = ({ data, user }: ViewUserModalProps) => {
  const [formData, setFormData] = useState<DisplayUserInfoDto | null>(null);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [isAssignStores, setIsAssignStores] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeInterface | null>(
    null
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
    fetcher
  );
  useEffect(() => {
    if (response.data && response.data.length > 0) {
      setFormData(response.data[0]);
    }
  }, [data, response.data]);
  const handUserChange = handleChange(formData, setFormData);
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
        }
      );
      const res = await result.json();
      console.log({ res });
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
    <div className="flex flex-col h-full gap-2 overflow-y-auto">
      {isLoading ? (
        <LoaderComponent />
      ) : (
        <>
          <BigCard
            isRounded={false}
            title={"User Information"}
            leftTitle={
              <IconButton
                onClick={function (): void {
                  throw new Error("Function not implemented.");
                }}
                icon={<Edit className="w-4 h-4" />}
                label={"Edit User Information"}
                bg={"primary"}
                showLabel={false}
              />
            }
          >
            <div className="flex flex-col gap-2">
              <div className="flex">
                <Input
                  label={"ID"}
                  name={"userId"}
                  value={formData?.userId ?? ""}
                  disabled
                  sizes={"xs"}
                  onChange={handUserChange}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  label={"First Name"}
                  name={"userFname"}
                  value={formData?.userFname ?? ""}
                  sizes={"xs"}
                  onChange={handUserChange}
                  disabled
                />
                <Input
                  label={"Middle Name"}
                  name={"userFname"}
                  value={formData?.userMname ?? ""}
                  sizes={"xs"}
                  onChange={handUserChange}
                  disabled
                />
              </div>
              <div className="flex gap-2">
                <Input
                  label={"Last Name"}
                  name={"userFname"}
                  value={formData?.userLname ?? ""}
                  sizes={"xs"}
                  onChange={handUserChange}
                  disabled
                />
                <Input
                  label={"Role"}
                  name={"userFname"}
                  value={formData?.userRole ?? ""}
                  sizes={"xs"}
                  onChange={handUserChange}
                  disabled
                />
              </div>
              <div className="flex flex-col">
                <Input
                  label={"Email"}
                  name={"userFname"}
                  value={formData?.userEmail ?? ""}
                  sizes={"xs"}
                  disabled
                  onChange={handUserChange}
                />
              </div>
              <div className="flex flex-col">
                <Input
                  label={"Status"}
                  name={"userFname"}
                  disabled
                  value={formData?.userStatus ?? ""}
                  sizes={"xs"}
                  onChange={handUserChange}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  label={"Created"}
                  name={"userFname"}
                  value={formatDateToWords(formData?.userCreatedAt ?? "") ?? ""}
                  sizes={"xs"}
                  onChange={handUserChange}
                  disabled
                />
                <Input
                  label={"Updated"}
                  name={"userFname"}
                  value={formatDateToWords(formData?.userUpdatedAt ?? "") ?? ""}
                  disabled
                  sizes={"xs"}
                  onChange={handUserChange}
                />
              </div>
            </div>
          </BigCard>
          {formData?.empId && (
            <BigCard
              isRounded={false}
              title={"Employee Info"}
              leftTitle={
                <IconButton
                  onClick={function (): void {
                    setShowEditEmployee(true);
                    handleEditEmployee();
                  }}
                  icon={<Edit className="w-4 h-4" />}
                  label={"Edit Employee Info"}
                  bg={"primary"}
                  showLabel={false}
                />
              }
            >
              <div className="flex flex-col gap-2">
                <div className="flex">
                  <Input
                    label={"Employee ID"}
                    name={"empId"}
                    value={formData?.empId ?? ""}
                    disabled
                    sizes={"xs"}
                    onChange={handUserChange}
                  />
                </div>
                <div className="flex">
                  <Input
                    label={"Position"}
                    name={"userId"}
                    value={formData?.empPosition ?? ""}
                    disabled
                    sizes={"xs"}
                    onChange={handUserChange}
                  />
                </div>
                <div className="flex flex-col">
                  {" "}
                  <div className="flex mb-2 justify-between items-center">
                    <label
                      className={`text-[10px] lg:text-xs font-semibold text-gray-700`}
                    >
                      Assigned Store
                    </label>
                  </div>
                  <div className="flex flex-col gap-2">
                    {formData?.storeEmployees?.map((store, index) => (
                      <div
                        className="flex p-2 gap-4 border border-gray-200 shadow"
                        key={store.storeId}
                      >
                        <span className="text-[10px] lg:text-xs">
                          #{index + 1}
                        </span>
                        <span className="text-[10px] lg:text-xs">
                          {store.storeName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BigCard>
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
