import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import {
  ConvertInventoryItems,
  ConvertInventoryItemsDto,
  DisplayInventoryItems,
} from "@/dtos/inventory.dto";
import { ItemConversions } from "@/types/items";
import React, { useState } from "react";
import AddConversionModal from "./AddConversionModal";
import { handleChange } from "@/utils/handle-change";

interface ConvertSectionProps {
  data: DisplayInventoryItems | null;
}

const dataCon: ItemConversions[] = [
  {
    itemConId: 1,
    fromItemId: 1,
    fromUnit: "box",
    fromQuantity: 1,
    toItemId: 2,
    toQuantity: 12,
    toUnit: "bot",
    itemConCreatedBy: 1,
  },
];

const ConvertSection = ({ data }: ConvertSectionProps) => {
  const [showAddConversionModal, setShowAddConversionModal] = useState(false);
  const [fromForm, setFromForm] = useState<ConvertInventoryItems>({
    inventoryItemId: data?.inventoryItemId ?? 0,
    inventoryItemQuantity: 0,
  });
  const [toForm, setToForm] = useState<ConvertInventoryItems>({
    inventoryItemId: 0,
    inventoryItemQuantity: 0,
  });
  //   const [convertFormData, setConvertFormData] =
  //     useState<ConvertInventoryItemsDto>({
  //       to: {
  //         inventoryItemId: data?.inventoryItemId ?? 0,
  //         inventoryItemQuantity: 0,
  //       },
  //       from: {
  //         inventoryItemId: 0,
  //         inventoryItemQuantity: 0,
  //       },
  //     });
  const handleFromConvertChange = handleChange(fromForm, setFromForm);
  const handleToConvertChange = handleChange(toForm, setToForm);
  const handleConvertItem = async () => {
    const convertFormData: ConvertInventoryItemsDto = {
      to: toForm,
      from: fromForm,
    };
    console.log(convertFormData);
  };
  const handAddConversionItem = async () => {};
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 min-h-80">
        <BigCard
          isRounded={false}
          title="Conversion Item"
          leftTitle={
            <div>
              <Button label="Convert" size="xs" onClick={handleConvertItem} />
            </div>
          }
        >
          <div className="space-y-2">
            <div className="flex flex-col border border-gray-200 p-2">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-xs">Item Name: </span>
                <span className="text-xs">{data?.itemName} </span>
                <span className="text-xs">Unit: </span>
                <span className="text-xs">{data?.itemUnit} </span>
                <span className="text-xs">Category: </span>
                <span className="text-xs">{data?.categoryName} </span>
                <span className="text-xs">Stock Availble: </span>
                <span className="text-xs font-semibold">
                  {data?.inventoryItemQuantity}{" "}
                </span>
              </div>
            </div>
            <div className="flex flex-col border border-gray-200">
              <div className="flex gap-2">
                <div className="flex flex-col  p-2">
                  <Input
                    label={"From"}
                    sizes="sm"
                    readOnly
                    defaultValue={data?.itemUnit}
                  />
                  <Input
                    label={"Quantity"}
                    sizes="sm"
                    value={fromForm.inventoryItemQuantity ?? 0}
                    type="number"
                    name="inventoryItemQuantity"
                    onChange={handleFromConvertChange}
                  />
                </div>
                <div className="border border-gray-200"></div>
                <div className="flex flex-col  p-2">
                  <DropdownSelect
                    label={"To"}
                    sizes="sm"
                    name={""}
                    value={undefined}
                    options={[]}
                  />
                  <Input
                    label={"To Qty"}
                    sizes="sm"
                    value={toForm.inventoryItemQuantity ?? 0}
                    name="inventoryItemQuantity"
                    type="number"
                    onChange={handleToConvertChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </BigCard>
      </div>
      <div className="flex-1 min-h-80">
        <BigCard
          isRounded={false}
          title="Conversion List"
          leftTitle={
            <div>
              <Button
                label="Add Conversion"
                size="xs"
                onClick={() => {
                  setShowAddConversionModal(true);
                }}
              />
            </div>
          }
        >
          <div className="flex flex-col">
            {dataCon.length > 0 ? (
              <>
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">From</div>
                  <div className="col-span-2 text-center">→</div>
                  <div className="col-span-4">To</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Conversion Items */}
                {dataCon.map((itemCon, index) => (
                  <ConversionCard
                    data={itemCon}
                    index={index}
                    key={itemCon.itemConId}
                  />
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                No conversions added yet
              </div>
            )}
          </div>
        </BigCard>
      </div>
      <Modal
        title="Add Conversion"
        isOpen={showAddConversionModal}
        onClose={function (): void {
          setShowAddConversionModal(false);
        }}
      >
        <AddConversionModal data={data} />
      </Modal>
    </div>
  );
};

export default ConvertSection;

interface ConversionCardProps {
  data: ItemConversions;
  index: number;
}

const ConversionCard = ({ data, index }: ConversionCardProps) => {
  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
      {/* Index */}
      <div className="col-span-1 flex items-center">
        <span className="text-xs text-gray-500">{index + 1}</span>
      </div>

      {/* From Unit */}
      <div className="col-span-4 flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {data.fromQuantity} {data.fromUnit}
          </span>
          <span className="text-xs text-gray-500">Item #{data.fromItemId}</span>
        </div>
      </div>

      {/* Arrow */}
      <div className="col-span-2 flex items-center justify-center">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
      </div>

      {/* To Unit */}
      <div className="col-span-4 flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {data.toQuantity} {data.toUnit}
          </span>
          <span className="text-xs text-gray-500">Item #{data.toItemId}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="col-span-1 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1 hover:bg-gray-200 rounded">
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
