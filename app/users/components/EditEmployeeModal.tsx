import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";

import Table, { Column } from "@/components/shared/Table";
import { positionOptions } from "@/constants/dropdown-options";
import { CreateStoreEmployeeDto } from "@/dtos/store.dto";
import { EmployeeInterface } from "@/types/employees";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import { handleChange } from "@/utils/handle-change";
import React, { useEffect, useState } from "react";

import useSWR from "swr";
interface EditEmployeeModalProps {
  data: EmployeeInterface | null;
  onSaveStoreEmployee: (data: CreateStoreEmployeeDto[]) => Promise<boolean>;
  isLoadingAssign?: boolean;
  onClose: () => void;
}
const storeColumn: Column<StoreInterface>[] = [
  { name: "ID", key: "storeId" },
  { name: "Name", key: "storeName" },
  { name: "Location", key: "storeLocation" },
  { name: "Description", key: "storeDescription" },
];
const EditEmployeeModal = ({
  data,
  onSaveStoreEmployee,
  isLoadingAssign,
  onClose,
}: EditEmployeeModalProps) => {
  const [empFormData, setEmpFormData] = useState<EmployeeInterface | null>(
    null
  );
  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: StoreInterface[] }>("/api/stores/", fetcher);
  useEffect(() => {
    if (data) {
      setEmpFormData(data);
    }
  }, [data]);
  const handleOnChange = handleChange(empFormData, setEmpFormData);

  const [stores, setStores] = useState<StoreInterface[] | null>(null);
  const [selectedStores, setSelectedStores] = useState<StoreInterface[] | null>(
    null
  );
  useEffect(() => {
    // Don't run if empFormData is still null
    if (!empFormData || !response.data.length) return;

    console.log("🔄 Filtering stores with empFormData:", empFormData);

    const storeData = response.data.filter((store: StoreInterface) => {
      // Check if store is not already selected
      return !empFormData.storeEmployees?.some(
        (selectedStore: StoreInterface) =>
          selectedStore.storeId === store.storeId
      );
    });

    setStores(storeData);
  }, [response.data, empFormData]);

  const handleSelectionChange = (store: StoreInterface[]) => {
    setSelectedStores(store);
  };

  const handleSaveAssignStores = async () => {
    if (!empFormData && selectedStores?.length === 0) {
      return;
    }
    const storeEmployee: CreateStoreEmployeeDto[] =
      selectedStores?.map((store) => ({
        empId: empFormData?.empId ?? 0,
        storeId: store.storeId ?? 0,
        storeEmpCreatedBy: 0,
      })) ?? [];
    console.log({ storeEmployee });
    const success = await onSaveStoreEmployee(storeEmployee);
    if (success) {
      mutate();
      onClose();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 bg-white p-2 shadow">
        <DropdownSelect
          label={"Position"}
          value={empFormData?.empPosition ?? ""}
          sizes={"xs"}
          name={"empPosition"}
          options={positionOptions}
          onChange={handleOnChange}
        />
        <div className="flex justify-end mt-auto gap-4">
          <div>
            <Button label="Cancel" size="xs" color="secondary" />
          </div>
          <div>
            <Button label="Save Position" size="xs" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white p-2 shadow">
          <h1 className="text-xs font-semibold mb-3">Assigned Stores</h1>
          <div className="flex flex-col gap-2">
            {empFormData?.storeEmployees?.map((store, index) => (
              <div
                className="flex p-2 gap-4 border border-gray-200 shadow"
                key={store.storeId}
              >
                <span className="text-[10px] lg:text-xs">#{index + 1}</span>
                <span className="text-[10px] lg:text-xs">
                  {store.storeName}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-2 shadow flex-col flex gap-2">
          <h1 className="text-xs font-semibold mb-3">Select Stores</h1>
          <Table
            showCheckBox
            isRounded={false}
            loading={isLoading}
            columns={storeColumn}
            data={stores ?? []}
            onSelectionChange={handleSelectionChange}
            uniqueIdKey="storeId"
            // onSelectedData={data?.storeEmployees}
          />
          <div className="flex justify-end mt-auto gap-4">
            <div>
              <Button
                label="Cancel"
                size="xs"
                color="secondary"
                disabled={isLoadingAssign}
              />
            </div>
            <div>
              <Button
                label="Save Assign Stores"
                size="xs"
                onClick={handleSaveAssignStores}
                loading={isLoadingAssign}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
