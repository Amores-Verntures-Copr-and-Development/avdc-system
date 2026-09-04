import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import Toggle from "@/components/shared/Toggle";
import { CreateCompanyDto } from "@/dtos/company.dto";
import { Companies } from "@/types/company";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";

interface AddCompanyModalProps {
  onCancel: () => void;
  onSubmit: (
    data: Omit<CreateCompanyDto, "companyCreatedBy">,
  ) => Promise<boolean>;
}

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Cancelled", value: "cancelled" },
];

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<Omit<CreateCompanyDto, "companyCreatedBy">>({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyStatus: "active",
    companyMaxStores: 0,
    companyInstallmentEnabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const handleFormChange = handleChange(form, setForm);

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
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        <Input
          label={"Company Name"}
          sizes="sm"
          value={form.companyName}
          name="companyName"
          onChange={handleFormChange}
        />
        <DropdownSelect
          label={"Status"}
          sizes="sm"
          value={form.companyStatus ?? "active"}
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
          sizes="sm"
          value={form.companyEmail ?? ""}
          name="companyEmail"
          onChange={handleFormChange}
        />
        <Input
          label={"Phone"}
          sizes="sm"
          value={form.companyPhone ?? ""}
          name="companyPhone"
          onChange={handleFormChange}
        />
        <Input
          label={"Max Stores"}
          type="number"
          min={0}
          sizes="sm"
          value={form.companyMaxStores ?? ""}
          name="companyMaxStores"
          onChange={(e) =>
            setForm({ ...form, companyMaxStores: Number(e.target.value) })
          }
        />
        <Toggle
          label="Installment Feature"
          sizes="sm"
          initial={!!form.companyInstallmentEnabled}
          onToggle={(enabled) =>
            setForm({ ...form, companyInstallmentEnabled: enabled })
          }
        />
      </div>
      <div className="flex justify-end space-x-2">
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
          label="Add Company"
          className="text-sm font-semibold"
          onClick={handleAdd}
          loading={isSaving}
          disabled={!form.companyName.trim()}
        />
      </div>
    </div>
  );
};

export default AddCompanyModal;
