import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import DropdownSelect from "@/components/shared/DropdownSelect";
import DropDownSelectItemConversion from "@/components/shared/DropDownSelectItemConversion";
import Input from "@/components/shared/Input";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { CreateItemConversionDto } from "@/dtos/items.dto";
import { UserAuth } from "@/hooks/useSession";
import { ItemInterface } from "@/types/items";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddConversionModalProps {
  data: DisplayInventoryItems | null;
  user?: UserAuth | null;
  onClose: () => void;
}

const AddConversionModal = ({
  data,
  user,
  onClose,
}: AddConversionModalProps) => {
  const [convertForm, setConvertForm] = useState<CreateItemConversionDto>({
    fromItemId: data?.itemId ?? 0,
    fromUnit: data?.itemUnit ?? "",
    fromQuantity: 1,
    toItemId: 0,
    toQuantity: 0,
    toUnit: "",
    itemConCreatedBy: 0,
  });

  const handleQuantityChange = handleChange(convertForm, setConvertForm);
  const handleCreateConversion = async () => {
    const newForm: CreateItemConversionDto = {
      ...convertForm,
      itemConCreatedBy: user?.userId ?? 0,
    };
    console.log("Create Conversion: ", newForm);
    try {
      const result = await fetch(`api/items/${newForm.fromItemId}/conversion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newForm),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      onClose();
    } catch (e) {
      console.log(e);
      toast.error("Failed to create conversion.");
    }
  };
  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Current Item Info Section */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Current Item
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Item Name</span>
            <span className="font-medium text-gray-900">
              {data?.itemName || "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Current Unit</span>
            <span className="font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded-md inline-block w-fit">
              {data?.itemUnit || "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Category</span>
            <span className="font-medium text-gray-900">
              {data?.categoryName || "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Current Quantity</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">1</span>
              <span className="text-gray-400 text-sm">×</span>
              <span className="font-medium text-gray-900">
                {data?.itemUnit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Form Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Conversion Details
        </h2>

        <div className="space-y-4">
          {/* Search Item Dropdown */}
          <div>
            <DropDownSelectItemConversion
              name={"toItemId"}
              label="Select Unit"
              value={String(convertForm.toItemId)}
              sizes="xs"
              itemName={data?.itemName ?? ""}
              id={data?.itemId}
              onChange={handleQuantityChange}
              selectedItem={(row) => {
                if (row) {
                  setConvertForm((prev) => ({
                    ...prev,
                    toUnit: row.itemUnit,
                    toItemId: row.itemId,
                  }));
                  console.log({ row });
                  console.log({ convertForm });
                }
              }}
            />
          </div>

          {/* Conversion Ratio */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={"From Quantity"}
              sizes={"xs"}
              defaultValue={`1 x ${data?.itemUnit}`}
              disabled
              readOnly
            />

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Input
                  label={"To Quantity"}
                  sizes={"xs"}
                  value={convertForm.toQuantity}
                  name="toQuantity"
                  onChange={handleQuantityChange}
                  type="number"
                />
                {convertForm.toUnit && (
                  <span className="font-medium text-green-600 bg-green-50 px-3 py-2 rounded-md border border-green-100 min-w-[80px] text-center">
                    {convertForm.toUnit}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Conversion Summary */}
          {convertForm.toQuantity > 0 && convertForm.toUnit && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex items-center justify-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">1</span>
                  <span className="text-gray-600">{data?.itemUnit}</span>
                </div>
                <span className="text-gray-400">=</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {convertForm.toQuantity}
                  </span>
                  <span className="text-gray-600">{convertForm.toUnit}</span>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500 mt-1">
                1 {data?.itemUnit} equals {convertForm.toQuantity}{" "}
                {convertForm.toUnit}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          label="Cancel"
          size="sm"
          color="nocolor"
          className="px-6 border border-gray-300 hover:bg-gray-50"
        />
        <Button
          label="Create Conversion"
          size="sm"
          className="px-6 bg-blue-600 hover:bg-blue-700"
          disabled={!convertForm.toItemId || convertForm.toQuantity <= 0}
          onClick={handleCreateConversion}
        />
      </div>
    </div>
  );
};

export default AddConversionModal;
