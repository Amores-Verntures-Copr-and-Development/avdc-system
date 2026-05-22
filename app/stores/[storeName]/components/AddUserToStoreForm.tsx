import Button from "@/components/shared/Button";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import DropDownSearchUser, {
  UserFullDetails,
} from "@/components/shared/DropDownSearchUser";
import { CreateStoreEmployeeDto } from "@/dtos/store.dto";
import { useSession } from "@/hooks/useSession";
import { StoreInterface } from "@/types/stores";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddUserToStoreFormProps {
  mutate: () => void;
  onCancel: () => void;
  store: StoreInterface | null;
}
const AddUserToStoreForm = ({
  mutate,
  onCancel,
  store,
}: AddUserToStoreFormProps) => {
  const { user } = useSession();
  const [form, setForm] = useState<CreateStoreEmployeeDto>({
    empId: 0,
    storeId: 0,
    storeEmpCreatedBy: 0,
  });
  const [isAdding, setIsAdding] = useState(false);
  const handleAddUserToStore = async () => {
    setIsAdding(true);
    if (!form.empId) {
      toast.error("Please select a user to add.");
      return;
    }

    if (!store?.storeId) {
      toast.error("Store information is missing.");
      return;
    }
    try {
      const res = await fetch(`/api/stores/${store.storeId}/store-employee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empId: form.empId,
          storeEmpCreatedBy: user?.userId,
          storeId: store?.storeId,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to add user to store");
      }
      toast.success("User added to store successfully!");
      mutate();
      onCancel();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsAdding(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <DropDownSearchUser
        onSelect={function (item: UserFullDetails): void {
          setForm((prev) => ({
            ...prev,
            empId: item.empId,
          }));
        }}
      />
      <div className="mt-auto  flex justify-end gap-2">
        <div>
          <Button
            label="Cancel"
            size={"sm"}
            color="secondary"
            onClick={onCancel}
            disabled={isAdding}
          />
        </div>
        <div>
          <Button
            label="Add User"
            size={"sm"}
            onClick={handleAddUserToStore}
            loading={isAdding}
          />
        </div>
      </div>
    </div>
  );
};

export default AddUserToStoreForm;
