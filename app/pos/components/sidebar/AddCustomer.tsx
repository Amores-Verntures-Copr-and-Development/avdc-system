import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { CreateCustomerDto } from "@/dtos/customer.dto";
import { UserAuth } from "@/hooks/useSession";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddCustomerProps {
  storeId: number | null;
  user: UserAuth | null;
  onClose: () => void;
}

const AddCustomer = ({ storeId, user, onClose }: AddCustomerProps) => {
  const [customerForm, setCustomerForm] = useState<CreateCustomerDto>({
    storeId: storeId ?? 0,
    customerCreatedBy: user?.userId ?? 0,
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    customerType: "",
    customerAddress: "",
  });
  const handleCusChange = handleChange(customerForm, setCustomerForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmitAddCustomer = async () => {
    setIsSubmitting(true);
    try {
      if (customerForm.customerName === "") {
        toast.error("Customer is required!");
        return false;
      }
      if (customerForm.customerType === "") {
        toast.error("Customer type is required!");
        return false;
      }
      if (customerForm.storeId === 0 || !customerForm.storeId) {
        toast.error("No store ID is required!");
        return false;
      }
      const data = await fetch(`/api/customers/store/${user?.storeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([customerForm]),
        credentials: "include",
      });
      const res = await data.json();
      if (!res.success) {
        throw new Error(res.message || "Failed to add customer.");
      }
      toast.success(res.message);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="grid grid-cols-1 gap-2">
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
        <Input
          label={"Email"}
          sizes={"xs"}
          type="email"
          onChange={handleCusChange}
          name="customerEmail"
          value={customerForm.customerEmail}
        />
        <Input
          label={"Type (Staff)"}
          sizes={"xs"}
          onChange={handleCusChange}
          name="customerType"
          value={customerForm.customerType}
        />
      </div>
      <div className="flex mt-auto justify-end gap-3">
        <div>
          <Button
            size="sm"
            label="Cancel"
            color="secondary"
            disabled={isSubmitting}
            onClick={onClose}
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

export default AddCustomer;
