import Button from "@/components/shared/Button";
import DropDownSearchStore from "@/components/shared/DropDownSearchStore";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import { positionOptions, roleOptions } from "@/constants/dropdown-options";
import { CreateUserDto } from "@/dtos/user.dto";
import { UserAuth } from "@/hooks/useSession";
import { StoreInterface } from "@/types/stores";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
interface AddUserModalProps {
  onSubmit: (data: CreateUserDto) => Promise<boolean>;
  onCancel: () => void;
  user?: UserAuth | null;
}
const AddUserModal: React.FC<AddUserModalProps> = ({
  onCancel,
  onSubmit,
  user,
}) => {
  const userDefaultForm: CreateUserDto = {
    userEmail: "",
    userFname: "",
    userLname: "",
    userName: "",
    userPassword: "",
    userRole: null,
    userAddedBy: user?.userId ?? null,
    userMname: "",
    empPosition: null,
    storeId: null,
  };
  const [addUserFormData, setAddUserFormData] =
    useState<CreateUserDto>(userDefaultForm);
  const handleFormChange = handleChange(addUserFormData, setAddUserFormData);
  const handleSubmit = async () => {
    const success = await onSubmit(addUserFormData);
    if (success) {
      onCancel();
    }
  };
  const searchStore = async (query: string): Promise<StoreInterface[]> => {
    const res = await fetch(
      `/api/stores/search?search=${encodeURIComponent(query)}`
    );
    const json = await res.json();
    return json.data || [];
  };
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h1 className="text-md font-semibold mb-3">User Information</h1>
        <div className="flex flex-wrap gap-4">
          <Input
            sizes={"xs"}
            value={addUserFormData.userFname}
            name="userFname"
            label={"First Name"}
            onChange={handleFormChange}
          />
          <Input
            sizes={"xs"}
            value={addUserFormData.userMname ?? ""}
            name="userMname"
            label={"Midlle Name (optional)"}
            onChange={handleFormChange}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Input
            sizes={"xs"}
            value={addUserFormData.userLname ?? ""}
            name="userLname"
            label={"Last Name"}
            onChange={handleFormChange}
          />
          <Input
            sizes={"xs"}
            name="userEmail"
            value={addUserFormData.userEmail}
            label={"Email"}
            type="email"
            onChange={handleFormChange}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Input
            sizes={"xs"}
            label={"Username"}
            value={addUserFormData.userName}
            name="userName"
            onChange={handleFormChange}
          />
          <Input
            sizes={"xs"}
            label={"Password"}
            value={addUserFormData.userPassword}
            name="userPassword"
            type="password"
            onChange={handleFormChange}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DropdownSelect
            name={"userRole"}
            sizes={"xs"}
            label={"Role"}
            value={addUserFormData.userRole ?? ""}
            onChange={handleFormChange}
            options={roleOptions}
          />
        </div>
      </div>
      {addUserFormData.userRole === "employee" && (
        <div className="space-y-3">
          <h1 className="text-md font-semibold mb-3">Employee Information</h1>
          <div className="flex flex-wrap gap-4">
            <DropdownSelect
              name={"empPosition"}
              sizes={"xs"}
              label={"Position"}
              value={addUserFormData.empPosition ?? ""}
              onChange={handleFormChange}
              options={positionOptions}
            />
            <DropDownSearchStore
              label="Store"
              sizes="xs"
              searchFn={searchStore}
              onSelect={(store) => {
                setAddUserFormData({
                  ...addUserFormData,
                  storeId: store.storeId,
                });
              }}
              renderItem={(store) => (
                <span>
                  <span>{store.storeName}</span>
                </span>
              )}
              displayValue={(s) => `${s.storeName}`}
            />
          </div>
        </div>
      )}
      <div className="flex pl-100 space-x-2">
        <Button
          size="md"
          className="text-sm font-semibold"
          color="nocolor"
          label="Cancel"
          onClick={onCancel}
        />
        <Button
          size="md"
          label="Add User"
          className="text-sm font-semibold"
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
};

export default AddUserModal;
