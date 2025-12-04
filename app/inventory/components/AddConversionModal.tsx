import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { CreateItemConversionDto } from "@/dtos/items.dto";
import React, { useState } from "react";

interface AddConversionModalProps {
  data: DisplayInventoryItems | null;
}
const AddConversionModal = ({ data }: AddConversionModalProps) => {
  const [convertForm, setConvertForm] = useState<CreateItemConversionDto>({
    fromItemId: data?.itemId ?? 0,
    fromUnit: data?.itemUnit ?? "",
    fromQuantity: 1,
    toItemId: 0,
    toQuantity: 0,
    toUnit: "",
    itemConCreatedBy: 0,
  });
  return <div>AddConversionModal</div>;
};

export default AddConversionModal;
