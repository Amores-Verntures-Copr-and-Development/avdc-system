import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { DisplayRequestItems } from "@/dtos/request.dto";
import { RequestItems } from "@/types/request";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AdditionalReceiveModalProps {
  data: DisplayRequestItems | null;
  mutate: () => void;
  onClose: () => void;
}

export interface AdditionalReceiveDto {
  requestItems: Partial<RequestItems>;
  additionalReceive: number;
}

const AdditionalReceiveModal = ({
  data,
  mutate,
  onClose,
}: AdditionalReceiveModalProps) => {
  const [additional, setAdditional] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmitAdditional = async () => {
    setIsSubmitting(true);

    try {
      if (!data) {
        toast.error("No request item found!");
        return;
      }
      if (Number(additional) === 0) {
        toast.error("Cannot submit 0 quantity!");
        return;
      }
      const additionalData: AdditionalReceiveDto = {
        requestItems: data,
        additionalReceive: additional,
      };
      const res = await fetch(
        `/api/requests/request-items/${additionalData.requestItems.requestId}/${additionalData.requestItems.reqItemId}/receive/additional`,
        {
          method: "POST",
          body: JSON.stringify(additionalData),
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
        Previous received:
        <span className="font-semibold underline">
          {" "}
          {data?.reqItemReceived}
        </span>
      </label>
      <Input
        label={"Additional Receive"}
        sizes={"sm"}
        type="number"
        name="additional"
        value={additional === 0 ? "" : additional}
        onChange={(e) => setAdditional(Number(e.target.value))}
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
            label="Receive"
            size="sm"
            onClick={handleSubmitAdditional}
            loading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalReceiveModal;
