import Button from "@/components/shared/Button";
import DropDownSelectCompany from "@/components/shared/DropDownSelectCompany";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/TextArea";
import { CreateStoreDto } from "@/dtos/store.dto";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
interface AddStoreModalProps {
  onCancel: () => void;
  onSubmit: (data: CreateStoreDto) => Promise<boolean>;
  // A superadmin isn't tied to one company, so they pick it here - defaults
  // to whichever company is already filtered on the Stores page, but can
  // still be changed before submitting.
  isSuperAdmin?: boolean;
  defaultCompanyId?: number;
}
const AddStoreModal: React.FC<AddStoreModalProps> = ({
  onCancel,
  onSubmit,
  isSuperAdmin,
  defaultCompanyId,
}) => {
  const [storeFormData, setStoreFormData] = useState<CreateStoreDto>({
    storeCreatedBy: 1,
    storeName: "",
    storeDescription: "",
    storeLocation: "",
    companyId: defaultCompanyId,
  });
  const needsCompany = Boolean(isSuperAdmin) && !storeFormData.companyId;
  const handleAddStore = async () => {
    const success = await onSubmit(storeFormData);
    if (success) {
      onCancel();
    }
  };
  const handleStoreChange = handleChange(storeFormData, setStoreFormData);
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStoreFormData((prev) => ({
      ...prev,
      companyId: e.target.value ? Number(e.target.value) : undefined,
    }));
  };
  return (
    <div className="space-y-5">
      {isSuperAdmin && (
        <DropDownSelectCompany
          name="companyId"
          sizes="xs"
          label="Company"
          value={
            storeFormData.companyId != null
              ? String(storeFormData.companyId)
              : ""
          }
          onChange={handleCompanyChange}
          required
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Input
          label={"Name"}
          name="storeName"
          value={storeFormData.storeName}
          sizes={"xs"}
          onChange={handleStoreChange}
        />
        <Input
          name="storeLocation"
          value={storeFormData.storeLocation ?? ""}
          label={"Location"}
          sizes={"xs"}
          onChange={handleStoreChange}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Textarea
          name="storeDescription"
          value={storeFormData.storeDescription ?? ""}
          label={"Description"}
          sizes="xs"
          onChange={handleStoreChange}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <div>
          <Button
            size="sm"
            className="text-sm font-semibold"
            color="secondary"
            label="Cancel"
            onClick={onCancel}
          />
        </div>
        <div>
          {" "}
          <Button
            size="sm"
            label="Add Store"
            className="text-sm font-semibold"
            onClick={handleAddStore}
            disabled={needsCompany}
          />
        </div>
      </div>
    </div>
  );
};

export default AddStoreModal;
