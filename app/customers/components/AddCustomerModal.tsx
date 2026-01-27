import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { CreateCustomerDto } from "@/dtos/customer.dto";
import { UserAuth } from "@/hooks/useSession";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddCustomerModalProps {
  user: UserAuth | null;
  storeId: number;
  onSumit: (data: CreateCustomerDto) => Promise<boolean>;
  isSubmitting?: boolean;
  onClose: () => void;
}
const AddCustomerModal = ({
  user,
  storeId,
  onSumit,
  onClose,
  isSubmitting,
}: AddCustomerModalProps) => {
  const [customerForm, setCustomerForm] = useState<CreateCustomerDto>({
    storeId: storeId,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerCreatedBy: 0,
    customerType: "",
  });
  const handleCusChange = handleChange(customerForm, setCustomerForm);
  const handleSubmitAddCustomer = async () => {
    if (!user?.userId) {
      toast.error("No user found!");
      return;
    }
    if (
      !user?.storeId &&
      (user?.empPosition === "staff" || user?.empPosition === "supervisor")
    ) {
      toast.error("No user found!");
      return;
    }
    const cusData: CreateCustomerDto = {
      ...customerForm,
      customerCreatedBy: user?.userId,
      storeId: user?.storeId ?? 0,
    };
    const success = await onSumit(cusData);
    if (success) {
      onClose();
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-4">
          <Input
            label={"Name"}
            sizes={"xs"}
            onChange={handleCusChange}
            name="customerName"
            value={customerForm.customerName}
          />
          <Input
            label={"Phone"}
            sizes={"xs"}
            onChange={handleCusChange}
            type="number"
            name="customerPhone"
            value={customerForm.customerPhone}
          />
        </div>
        <div className="flex gap-4">
          <Input
            label={"Email"}
            sizes={"xs"}
            type="email"
            onChange={handleCusChange}
            name="customerEmail"
            value={customerForm.customerEmail}
          />
        </div>
        <div className="grid grid-cols-2">
          <Input
            label={"Type (Staff)"}
            sizes={"xs"}
            onChange={handleCusChange}
            name="customerType"
            value={customerForm.customerType}
          />
        </div>
      </div>
      <div className="flex mt-auto justify-end gap-3">
        <div>
          <Button
            size="sm"
            label="Cancel"
            color="secondary"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Button
            size="sm"
            label="Add Customer"
            onClick={handleSubmitAddCustomer}
            loading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default AddCustomerModal;
