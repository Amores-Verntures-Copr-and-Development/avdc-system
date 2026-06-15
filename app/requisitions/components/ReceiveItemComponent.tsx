import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { DisplayRequestItems } from "@/dtos/request.dto";
import { RequestItems } from "@/types/request";
import { handleChange } from "@/utils/handle-change";

import React, { useState } from "react";
import toast from "react-hot-toast";

interface ReceiveItemComponentProps {
  data: DisplayRequestItems | null;
  mutate: () => void;
  onClose: () => void;
}

const ReceiveItemComponent = ({
  data,
  mutate,
  onClose,
}: ReceiveItemComponentProps) => {
  const [isReceiving, setIsReceiving] = useState(false);
  const [reqForm, setReqForm] = useState<Partial<RequestItems>>({
    reqItemId: data?.reqItemId,
    reqItemReceived: data?.reqItemReceived,
    invItem: data?.invItem,
    requestId: data?.requestId,
  });
  const handleChangeItem = handleChange(reqForm, setReqForm);

  const handleReceiveROItem = async () => {
    setIsReceiving(true);
    try {
      const res = await fetch(
        `/api/requests/request-items/${data?.requestId}/${data?.reqItemId}/receive`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqForm),
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
      setIsReceiving(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">
        Notes:{" "}
        <span className="font-normal">
          Receive this item from delivered item.
        </span>
      </h3>
      <BigCard isRounded={false} title={""}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <span className="text-xs">Name</span>
            <span className="text-sm font-semibold">{data?.itemName}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs">Unit</span>
            <span className="text-sm font-semibold">{data?.itemUnit}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs">Quantity Request</span>
            <span className="text-sm font-semibold">
              {data?.reqItemQuantity}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs">Status</span>
            <span className="text-sm font-semibold">{data?.reqItemStatus}</span>
          </div>
          <div>
            <Input
              type="number"
              label={"Quantity Receive"}
              sizes="xs"
              value={
                Number(reqForm.reqItemReceived) === 0
                  ? ""
                  : reqForm.reqItemReceived
              }
              name="reqItemReceived"
              onChange={handleChangeItem}
            />
          </div>
        </div>
      </BigCard>
      <div className="flex justify-end gap-2">
        <div>
          <Button
            label="Cancel"
            size="xs"
            color="secondary"
            disabled={isReceiving}
            onClick={onClose}
          />
        </div>
        <div>
          <Button
            label="Receive"
            size="xs"
            onClick={handleReceiveROItem}
            loading={isReceiving}
          />
        </div>
      </div>
    </div>
  );
};

export default ReceiveItemComponent;
