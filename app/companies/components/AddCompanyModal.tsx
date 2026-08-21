import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { CreateCompanyDto } from "@/dtos/company.dto";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";

interface AddCompanyModalProps {
  onCancel: () => void;
  onSubmit: (
    data: Omit<CreateCompanyDto, "companyCreatedBy">,
  ) => Promise<boolean>;
}

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<Omit<CreateCompanyDto, "companyCreatedBy">>({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
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
      <div className="flex flex-col gap-5">
        <Input
          label={"Company Name"}
          sizes="sm"
          value={form.companyName}
          name="companyName"
          onChange={handleFormChange}
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
