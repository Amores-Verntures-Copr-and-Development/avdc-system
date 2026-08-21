import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { CreateUserDto } from "@/dtos/user.dto";
import { handleChange } from "@/utils/handle-change";
import { AtSign, Lock, Mail, User as UserIcon } from "lucide-react";
import React, { useState } from "react";

type AddOwnerFormData = Pick<
  CreateUserDto,
  "userFname" | "userMname" | "userLname" | "userEmail" | "userName" | "userPassword"
>;

interface AddOwnerModalProps {
  onCancel: () => void;
  onSubmit: (data: AddOwnerFormData) => Promise<boolean>;
}

const AddOwnerModal: React.FC<AddOwnerModalProps> = ({ onCancel, onSubmit }) => {
  const [form, setForm] = useState<AddOwnerFormData>({
    userFname: "",
    userMname: "",
    userLname: "",
    userEmail: "",
    userName: "",
    userPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const handleFormChange = handleChange(form, setForm);

  const isValid =
    form.userFname.trim() &&
    form.userLname.trim() &&
    form.userEmail.trim() &&
    form.userName.trim() &&
    form.userPassword.trim();

  const handleAdd = async () => {
    setIsSaving(true);
    const success = await onSubmit(form);
    setIsSaving(false);
    if (success) {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          sizes="sm"
          label="First Name"
          name="userFname"
          value={form.userFname}
          onChange={handleFormChange}
          leadingIcon={<UserIcon className="h-3.5 w-3.5" />}
          required
        />
        <Input
          sizes="sm"
          label="Middle Name (optional)"
          name="userMname"
          value={form.userMname ?? ""}
          onChange={handleFormChange}
          leadingIcon={<UserIcon className="h-3.5 w-3.5" />}
        />
        <Input
          sizes="sm"
          label="Last Name"
          name="userLname"
          value={form.userLname}
          onChange={handleFormChange}
          leadingIcon={<UserIcon className="h-3.5 w-3.5" />}
          required
        />
        <Input
          sizes="sm"
          label="Email"
          type="email"
          name="userEmail"
          value={form.userEmail}
          onChange={handleFormChange}
          leadingIcon={<Mail className="h-3.5 w-3.5" />}
          required
        />
        <Input
          sizes="sm"
          label="Username"
          name="userName"
          value={form.userName}
          onChange={handleFormChange}
          leadingIcon={<AtSign className="h-3.5 w-3.5" />}
          required
        />
        <Input
          sizes="sm"
          label="Password"
          type="password"
          name="userPassword"
          value={form.userPassword}
          onChange={handleFormChange}
          leadingIcon={<Lock className="h-3.5 w-3.5" />}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          className="text-sm font-semibold"
          color="secondary"
          label="Cancel"
          onClick={onCancel}
          disabled={isSaving}
        />
        <Button
          size="sm"
          label="Add Owner"
          className="text-sm font-semibold"
          onClick={handleAdd}
          loading={isSaving}
          disabled={!isValid}
        />
      </div>
    </div>
  );
};

export default AddOwnerModal;
