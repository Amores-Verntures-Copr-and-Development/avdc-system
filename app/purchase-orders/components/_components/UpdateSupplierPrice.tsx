import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Toggle from "@/components/shared/Toggle";
import { CreateSupplierItemPriceDto } from "@/dtos/supplier.dto";
import { useSession } from "@/hooks/useSession";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { formatPeso } from "@/utils/formatPeso";
import { handleChange } from "@/utils/handle-change";
import { PhilippinePeso } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { mutate } from "swr";

interface UpdateSupplierPriceProps {
  data: PurchaseOrderItems | null;
  supplierName: string;
  onClose: () => void;
  mutate: () => void;
}

const UpdateSupplierPrice = ({
  data,
  supplierName,
  onClose,
  mutate,
}: UpdateSupplierPriceProps) => {
  const { user } = useSession();
  const [isUpdateItemPrice, setIsUpdateItemPrice] = useState(true);
  const [form, setForm] = useState<CreateSupplierItemPriceDto>({
    sipAmount: 0,
    suppItemId: 0,
    sipCreatedBy: user?.userId ?? 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const onChangePrice = handleChange(form, setForm);
  const handleUpdateSupplierPrice = async () => {
    try {
      setIsUpdating(true);
      if (!form.sipAmount) {
        toast.error("Amount is required!");
        return;
      }
      if (!data) {
        toast.error("No item is selected!");
        return;
      }
      const formData = {
        supplierItemPrice: form,
        poItem: data,
        isUpdateItem: isUpdateItemPrice,
      };
      console.log({ formData });
      const result = await fetch(
        `/api/purchase-order/${data?.poId}/suppliers/${data?.suppId}/${data?.poItemId}`,
        {
          body: JSON.stringify(formData),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(`${data?.itemName} price updated successfully`);
      mutate();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <div className="flex flex-col gap-5">
      {/* Header Context */}
      <div className="text-sm text-gray-600">
        Update supplier price for{" "}
        <span className="font-semibold text-gray-900">{data?.itemName}</span>{" "}
        from <span className="font-semibold text-gray-900">{supplierName}</span>
        .
      </div>

      <div className="bg-gray-50 border border-gray-300 rounded-lg p-1 flex justify-between items-center">
        <span className="text-xs text-gray-500">Current Price</span>
        <span className="text-sm font-semibold text-gray-900">
          {formatPeso(data?.unitPrice)}
        </span>
      </div>

      {/* Update Field */}
      <Input
        leadingIcon={<PhilippinePeso className="w-4 h-4" />}
        label={"New Price"}
        sizes={"sm"}
        value={Number(form.sipAmount) === 0 ? "" : form.sipAmount}
        onChange={onChangePrice}
        name="sipAmount"
      />
      <Toggle
        sizes="xs"
        flexType="flex-col"
        label="Update also the item price."
        initial={isUpdateItemPrice}
        onToggle={(state) => setIsUpdateItemPrice(state)}
      />

      <div className="flex justify-end gap-2">
        <div>
          {" "}
          <Button
            label="Cancel"
            size="sm"
            color="secondary"
            disabled={isUpdating}
          />
        </div>
        <div>
          {" "}
          <Button
            label="Update Price"
            size="sm"
            onClick={handleUpdateSupplierPrice}
            loading={isUpdating}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateSupplierPrice;
