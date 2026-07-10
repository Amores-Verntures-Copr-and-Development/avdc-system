import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { DisplayRequestItems } from "@/dtos/request.dto";
import { RequestItems } from "@/types/request";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface DeductReceiveModalProps {
  data: DisplayRequestItems | null;
  mutate: () => void;
  onClose: () => void;
}

export interface DeductReceiveDto {
  requestItems: Partial<RequestItems>;
  deductReceive: number;
}
const DeductReceiveModal = ({
  data,
  mutate,
  onClose,
}: DeductReceiveModalProps) => {
  const [deduction, setDeduction] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmitDeduction = async () => {
    setIsSubmitting(true);

    try {
      if (!data) {
        toast.error("No request item found!");
        return;
      }
      if (Number(deduction) === 0) {
        toast.error("Cannot submit 0 quantity!");
        return;
      }
      if (Number(deduction) > Number(data.reqItemReceived)) {
        toast.error("Quantity is greater than current receive!");
        return;
      }
      const deductionData: DeductReceiveDto = {
        requestItems: data,
        deductReceive: deduction,
      };
      const res = await fetch(
        `/api/requests/request-items/${deductionData.requestItems.requestId}/${deductionData.requestItems.reqItemId}/receive/deduct`,
        {
          method: "POST",
          body: JSON.stringify(deductionData),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      mutate();
      toast.success(result.message);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs 2xl:text-sm">
        Current received:
        <span className="font-semibold underline">
          {" "}
          {data?.reqItemReceived}
        </span>
      </label>
      <Input
        label={"Deduct Quantity"}
        sizes={"sm"}
        type="number"
        name="deduction"
        value={deduction === 0 ? "" : deduction}
        onChange={(e) => setDeduction(Number(e.target.value))}
      />
      <div className="flex justify-end gap-2">
        <div>
          <Button
            label="Cancel"
            size="sm"
            color="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Button
            label="Deduct"
            size="sm"
            onClick={handleSubmitDeduction}
            loading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default DeductReceiveModal;
