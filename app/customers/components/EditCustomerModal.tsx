import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { DisplayCustomerDto } from "@/dtos/customer.dto";
import { Customer } from "@/types/customer";
import { handleChange } from "@/utils/handle-change";
import { Save, X } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface EditCustomerModalProps {
  data: DisplayCustomerDto;
  mutate?: () => void;
  onClick?: () => void;
}

const EditCustomerModal = ({
  data,
  onClick,
  mutate,
}: EditCustomerModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>({
    customerId: data.customerId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerAddress: data.customerAddress,
    customerPhone: data.customerPhone,
    customerType: data.customerType,
  });

  const handleCusChange = handleChange(form, setForm);
  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/customers/${data.customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to update customer");
      }
      toast.success("Customer updated successfully");
      // Optionally, you can show a success message here
      if (mutate) mutate();
      if (onClick) onClick();
    } catch (error) {
      console.error(error);
      // Optionally, you can show an error message here
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex-col flex gap-4">
      <div className="grid grid-cols-1 gap-2">
        <Input
          label="Name"
          value={form.customerName}
          onChange={handleCusChange}
          sizes="sm"
          name="customerName"
        />
        <Input
          label="Email"
          type="email"
          value={form.customerEmail ?? ""}
          onChange={handleCusChange}
          sizes="sm"
          name="customerEmail"
        />

        <Input
          label="Phone"
          value={form.customerPhone ?? ""}
          onChange={handleCusChange}
          sizes="sm"
          name="customerPhone"
        />
        <Input
          label="Address"
          value={form.customerAddress ?? ""}
          onChange={handleCusChange}
          sizes="sm"
          name="customerAddress"
        />
        <Input
          label="Type"
          value={form.customerType}
          onChange={handleCusChange}
          sizes="sm"
          name="customerType"
        />
      </div>
      <div className="mt-auto flex justify-end space-x-2">
        <div>
          <Button
            label="Cancel"
            size="sm"
            onClick={() => {}}
            color="secondary"
            icon={X}
            disabled={isLoading}
          />
        </div>
        <div>
          <Button
            label="Save Changes"
            size="sm"
            onClick={handleSubmit}
            color="primary"
            icon={Save}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default EditCustomerModal;
