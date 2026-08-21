import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { handleChange } from "@/utils/handle-change";
import { KeyRound } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

interface ChangePasswordFormProps {
  userId?: number;
}

const ChangePasswordForm = ({ userId }: ChangePasswordFormProps) => {
  const [form, setForm] = useState<PasswordForm>(initialForm);
  const [errors, setErrors] = useState<Partial<PasswordForm>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handlePasswordChange = handleChange(form, setForm);

  const validate = (): boolean => {
    const nextErrors: Partial<PasswordForm> = {};

    if (!form.currentPassword) {
      nextErrors.currentPassword = "Current password is required";
    }

    if (!form.newPassword) {
      nextErrors.newPassword = "New password is required";
    } else if (form.newPassword.length < 8) {
      nextErrors.newPassword = "Must be at least 8 characters";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password";
    } else if (form.confirmPassword !== form.newPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !userId) return;

    setIsSaving(true);

    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        if (result.message?.toLowerCase().includes("current password")) {
          setErrors({ currentPassword: result.message });
        }
        throw new Error(result.message || "Failed to change password");
      }

      toast.success(result.message || "Password changed successfully!");
      setForm(initialForm);
      setErrors({});
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Current Password"
            type="password"
            name="currentPassword"
            sizes="sm"
            value={form.currentPassword}
            onChange={handlePasswordChange}
            error={errors.currentPassword}
          />
        </div>

        <Input
          label="New Password"
          type="password"
          name="newPassword"
          sizes="sm"
          value={form.newPassword}
          onChange={handlePasswordChange}
          error={errors.newPassword}
        />
        <Input
          label="Confirm New Password"
          type="password"
          name="confirmPassword"
          sizes="sm"
          value={form.confirmPassword}
          onChange={handlePasswordChange}
          error={errors.confirmPassword}
        />
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <Button
          label="Update Password"
          size="sm"
          onClick={handleSave}
          color="primary"
          icon={KeyRound}
          loading={isSaving}
        />
      </div>
    </div>
  );
};

export default ChangePasswordForm;
