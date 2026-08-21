import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import { Companies } from "@/types/company";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface EditCompanyModalProps {
  data: Companies | null;
  mutate: () => void;
  onCancel: () => void;
}

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Cancelled", value: "cancelled" },
];

const EditCompanyModal = ({ data, mutate, onCancel }: EditCompanyModalProps) => {
  const [form, setForm] = useState<Companies>({ ...data } as Companies);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/companies/${form.companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          companyEmail: form.companyEmail,
          companyPhone: form.companyPhone,
          companyStatus: form.companyStatus,
          companyMaxStores: Number(form.companyMaxStores),
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to update company");
      }
      toast.success("Company updated successfully!");
      mutate();
      onCancel();
    } catch (error: any) {
      toast.error(error.message || "Failed to update company!");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2">
        <Input
          label={"Company Name"}
          value={form.companyName}
          sizes="sm"
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          name={"companyName"}
        />
        <DropdownSelect
          label={"Status"}
          sizes="sm"
          value={form.companyStatus}
          options={statusOptions}
          onChange={(e) =>
            setForm({
              ...form,
              companyStatus: e.target.value as Companies["companyStatus"],
            })
          }
          name={"companyStatus"}
        />
        <Input
          label={"Email"}
          value={form.companyEmail ?? ""}
          sizes="sm"
          onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
          name={"companyEmail"}
        />
        <Input
          label={"Phone"}
          value={form.companyPhone ?? ""}
          sizes="sm"
          onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
          name={"companyPhone"}
        />
        <Input
          label={"Max Stores"}
          type="number"
          min={0}
          value={form.companyMaxStores ?? ""}
          sizes="sm"
          onChange={(e) =>
            setForm({ ...form, companyMaxStores: Number(e.target.value) })
          }
          name={"companyMaxStores"}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          label="Cancel"
          size="sm"
          color="secondary"
          disabled={isUpdating}
          onClick={onCancel}
        />
        <Button
          label="Save Changes"
          size="sm"
          onClick={handleSubmit}
          loading={isUpdating}
        />
      </div>
    </div>
  );
};

export default EditCompanyModal;
