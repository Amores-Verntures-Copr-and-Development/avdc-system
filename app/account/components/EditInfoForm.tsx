import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { DisplayUserInfoDto } from "@/dtos/user.dto";
import { handleChange } from "@/utils/handle-change";
import { Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface EditInfoFormProps {
  userId?: number;
  userInfo?: DisplayUserInfoDto | null;
  isLoading?: boolean;
  onSaved?: () => void;
}

interface InfoForm {
  userFname: string;
  userMname: string;
  userLname: string;
  userEmail: string;
}

const EditInfoForm = ({
  userId,
  userInfo,
  isLoading,
  onSaved,
}: EditInfoFormProps) => {
  const [form, setForm] = useState<InfoForm>({
    userFname: "",
    userMname: "",
    userLname: "",
    userEmail: "",
  });
  const [errors, setErrors] = useState<Partial<InfoForm>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userInfo) return;

    setForm({
      userFname: userInfo.userFname ?? "",
      userMname: userInfo.userMname ?? "",
      userLname: userInfo.userLname ?? "",
      userEmail: userInfo.userEmail ?? "",
    });
  }, [userInfo]);

  const handleInfoChange = handleChange(form, setForm);

  const validate = (): boolean => {
    const nextErrors: Partial<InfoForm> = {};

    if (!form.userFname.trim()) {
      nextErrors.userFname = "First name is required";
    }

    if (!form.userLname.trim()) {
      nextErrors.userLname = "Last name is required";
    }

    if (!form.userEmail.trim()) {
      nextErrors.userEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.userEmail.trim())) {
      nextErrors.userEmail = "Enter a valid email";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !userId) return;

    setIsSaving(true);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to update profile");
      }

      toast.success(result.message || "Profile updated successfully!");
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="First Name"
          name="userFname"
          sizes="sm"
          value={form.userFname}
          onChange={handleInfoChange}
          error={errors.userFname}
          disabled={isLoading}
        />

        <Input
          label="Middle Name"
          name="userMname"
          sizes="sm"
          value={form.userMname}
          onChange={handleInfoChange}
          disabled={isLoading}
        />

        <Input
          label="Last Name"
          name="userLname"
          sizes="sm"
          value={form.userLname}
          onChange={handleInfoChange}
          error={errors.userLname}
          disabled={isLoading}
        />

        <Input
          label="Email"
          type="email"
          name="userEmail"
          sizes="sm"
          value={form.userEmail}
          onChange={handleInfoChange}
          error={errors.userEmail}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <Button
          label="Save Changes"
          size="sm"
          onClick={handleSave}
          color="primary"
          icon={Save}
          loading={isSaving}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default EditInfoForm;
