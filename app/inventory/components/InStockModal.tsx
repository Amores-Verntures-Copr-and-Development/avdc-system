import Button from "@/components/shared/Button";
import Table, { Column, SelectOption } from "@/components/shared/Table";
import {
  CreateInventoryMovementDto,
  DisplayInventoryItems,
} from "@/dtos/inventory.dto";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const ADJUSTMENT_REASONS: SelectOption[] = [
  { label: "Select a reason", value: "" },
  { label: "Damage", value: "damage" },
  { label: "Loss", value: "loss" },
  { label: "Expiry", value: "expiry" },
  { label: "Count Correction", value: "count_correction" },
  { label: "Other", value: "other" },
];

interface InStockModalProps {
  data: DisplayInventoryItems[] | null;
  onSubmit: (row: CreateInventoryMovementDto[]) => Promise<boolean>;
  onClose: () => void;
  isSubmitting?: boolean;
}
const InStockModal = ({
  data,
  onClose,
  onSubmit,
  isSubmitting,
}: InStockModalProps) => {
  const [formData, setFormData] = useState<CreateInventoryMovementDto[]>();
  const getSpecificData = (id: number) => {
    const findData = data?.find((item) => item.inventoryItemId === id);
    return findData;
  };
  const columns: Column<CreateInventoryMovementDto>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    {
      key: "itemName",
      name: "Name",
      selector: (row) => {
        const data = getSpecificData(row.inventoryItemId);
        return <span>{data?.itemName}</span>;
      },
    },
    {
      key: "itemUnit",
      name: "Unit",
      selector: (row) => {
        const data = getSpecificData(row.inventoryItemId);
        return <span>{data?.itemUnit}</span>;
      },
    },
    {
      key: "stockAvailable",
      name: "Stock Available",
      selector: (row) => {
        const data = getSpecificData(row.inventoryItemId);
        return (
          <span>
            {formatQuantityByUnit(
              data?.inventoryItemQuantity ?? 0,
              data?.itemUnit ?? ""
            )}
          </span>
        );
      },
    },
    {
      key: "itemMovementQuantity",
      name: "Quantity",
      editable: true,
      inputType: "number",
    },
    {
      key: "itemMovementReason",
      name: "Reason",
      editable: true,
      inputType: "select",
      options: ADJUSTMENT_REASONS,
    },
    {
      key: "itemMovementRemarks",
      name: "Remarks",
      editable: true,
    },
  ];
  useEffect(() => {
    if (data) {
      setFormData(
        data.map((item) => ({
          inventoryId: item.inventoryId,
          inventoryItemId: item.inventoryItemId,
          itemMovementQuantity: 0,
          itemMovementReferenceId: null,
          itemMovementReference: "adjustment",
          itemMovementRemarks: "",
          itemMovementReason: null,
          itemMovementType: "in",
        }))
      );
    }
  }, [data]);
  const handleSubmit = async () => {
    if (!formData) {
      return;
    }
    const missingReason = formData.some(
      (row) => Number(row.itemMovementQuantity) > 0 && !row.itemMovementReason,
    );
    if (missingReason) {
      toast.error("Select a reason for every item with a quantity.");
      return;
    }
    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };
  return (
    <div className="flex flex-col h-full gap-2">
      <span className="text-[10px] xl:text-sm text-green-600 font-medium">
        Note: Input quantity for adding stock in inventory.
      </span>
      <div className="flex flex-col min-h-0 flex-1">
        <Table
          uniqueIdKey="inventoryItemId"
          columns={columns}
          data={formData ?? []}
          maxHeight="h-full"
          updateData={setFormData}
        />
      </div>
      <div className="border-t border-gray-300"></div>
      <div className="flex justify-end gap-4">
        <div>
          <Button
            size="sm"
            label="Cancel"
            color="neutral"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Button
            size="sm"
            label="Submit"
            onClick={handleSubmit}
            loading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default InStockModal;
