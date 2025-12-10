import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/TextArea";
import { CreateStockRoom } from "@/dtos/stockRoom.dto";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";

interface AddStockRoomModalProps {
  onSubmit: (row: CreateStockRoom) => Promise<boolean>;
  onClose: () => void;
}

const AddStockRoomModal = ({ onSubmit, onClose }: AddStockRoomModalProps) => {
  const [stockRoomFormData, setStockRoomFormData] = useState<CreateStockRoom>({
    stockRoomCreatedBy: 0,
    stockRoomDescription: "",
    stockRoomLocation: "",
    stockRoomName: "",
  });
  const handleOnChange = handleChange(stockRoomFormData, setStockRoomFormData);
  const handleSubmit = async () => {
    const success = await onSubmit(stockRoomFormData);
    if (success) {
      onClose();
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex-col flex gap-2">
        <h1 className="text-md font-semibold">Stock Room Information</h1>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {" "}
            <Input
              sizes={"xs"}
              value={stockRoomFormData.stockRoomName}
              name="stockRoomName"
              label={"Name"}
              onChange={handleOnChange}
            />
            <Input
              sizes={"xs"}
              value={stockRoomFormData.stockRoomDescription}
              name="stockRoomDescription"
              label={"Description"}
              onChange={handleOnChange}
            />
          </div>
          <div>
            <Textarea
              label={"Location"}
              sizes="xs"
              name="stockRoomLocation"
              value={stockRoomFormData.stockRoomLocation}
              onChange={handleOnChange}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <div>
          <Button size="sm" label="Cancel" color="secondary" />
        </div>
        <div>
          <Button size="sm" label="Submit" onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default AddStockRoomModal;
