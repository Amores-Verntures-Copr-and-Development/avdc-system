import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { CreateSupplierDto } from "@/dtos/supplier.dto";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
interface CreateSupplierModalProps {
  onSubmit: (data: CreateSupplierDto) => Promise<boolean>;
  onCancel: () => void;
}
const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [supplierFormData, setSupplierFormData] = useState<CreateSupplierDto>({
    suppCode: "",
    suppCreatedBy: 0,
    suppName: "",
    suppAddress: "",
    suppEmail: "",
    suppPhone: "",
    suppContactPerson: "",
  });
  const handleSubmit = async () => {
    const success = await onSubmit(supplierFormData);
    if (success) {
      onCancel();
    }
  };
  const handleStateChange = handleChange(supplierFormData, setSupplierFormData);
  return (
    <div className="space-y-4">
      {/* 🧾 Information Section */}
      <div>
        <h1 className="text-base font-semibold mb-2">Information</h1>
        <div className="flex flex-wrap gap-4">
          <Input
            sizes="xs"
            label="Supplier Name"
            name="suppName"
            placeholder="Enter supplier name"
            onChange={handleStateChange}
          />
          <Input
            sizes="xs"
            label="Contact Person"
            name="suppContactPerson"
            placeholder="Enter contact person"
            onChange={handleStateChange}
          />
        </div>
      </div>

      {/* 📞 Contact Section */}
      <div>
        <h1 className="text-base font-semibold mb-2">Contact</h1>
        <div className="flex flex-wrap gap-4">
          <Input
            sizes="xs"
            label="Email"
            name="suppEmail"
            placeholder="Enter email address"
            onChange={handleStateChange}
          />
          <Input
            sizes="xs"
            label="Phone"
            name="suppPhone"
            placeholder="Enter phone number"
            onChange={handleStateChange}
          />
        </div>
      </div>

      {/* 🏠 Address Section */}
      <div>
        <h1 className="text-base font-semibold mb-2">Address</h1>
        <div className="flex flex-wrap gap-4">
          <Input
            sizes="xs"
            label="Address"
            name="suppAddress"
            placeholder="Enter supplier address"
            onChange={handleStateChange}
          />
        </div>
      </div>
      <div className="flex justify-end gap-5">
        <div>
          <Button
            size="sm"
            label="Cancel"
            onClick={onCancel}
            color="nocolor"
            className="font-semibold"
          />
        </div>
        <div>
          <Button
            size="sm"
            label="Create"
            className="font-semibold"
            onClick={function (): void {
              handleSubmit();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateSupplierModal;
