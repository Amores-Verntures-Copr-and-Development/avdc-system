import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { UserAuth } from "@/hooks/useSession";
import React, { useEffect, useState } from "react";

import Button from "@/components/shared/Button";

import Table, { Column } from "@/components/shared/Table";
import { Plus, X } from "lucide-react";
import { DropDownSearchSupplier } from "@/components/shared/DropDownSearchSupplier";
import { Supplier } from "@/types/supplier";
import { CreateSupplierItemDto } from "@/dtos/supplier.dto";
interface AddItemSupplierModalProps {
  data: DisplayInventoryItems[];
  onCancel: () => void;
  onSubmit: (items: CreateSupplierItemDto[]) => Promise<boolean>;
  user?: UserAuth | null;
}

const AddItemSupplierModal = ({
  data,
  onCancel,
  onSubmit,
  user,
}: AddItemSupplierModalProps) => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  console.log({ selectedSupplier });
  const [itemData, setItemData] = useState<CreateSupplierItemDto[] | null>([]);
  useEffect(() => {
    if (data) {
      const mapped: CreateSupplierItemDto[] =
        data.map((item) => ({
          // example mapping — adjust fields as needed
          itemId: Number(item.itemId),
          suppId: 0,
          suppItemPrice: 0,
          suppItemCreatedBy: 0,
        })) ?? [];

      setItemData(mapped);
    }
  }, [data]);
  const columns: Column<CreateSupplierItemDto>[] = [
    {
      name: "ID",
      key: "itemId",
    },
    {
      name: "Item Name",
      key: "itemName",
      selector: (row) => data.find((it) => it.itemId === row.itemId)?.itemName,
    },
    {
      name: "Unit",
      key: "itemUnit",
      selector: (row) => data.find((it) => it.itemId === row.itemId)?.itemUnit,
    },
    {
      name: "Category",
      key: "categoryName",
      selector: (row) =>
        data.find((it) => it.itemId === row.itemId)?.categoryName,
    },
    {
      name: "Price",
      key: "suppItemPrice",
      editable: true,
      inputType: "number",
    },
  ];
  const handleSubmit = async () => {
    if (!itemData) {
      return;
    }
    const success = await onSubmit(itemData);
    if (success) {
      onCancel();
    }
  };
  return (
    <div className="flex flex-col overflow-hidden h-full">
      {/* Scrollable table area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2">
        <Table
          columns={columns}
          data={itemData ?? []}
          maxHeight="h-full"
          updateData={setItemData}
          uniqueIdKey="itemId"
        />
      </div>
      <div className="p-2">
        <span className="text-xs">
          <span className="text-red-400">Disclaimer:</span>&nbsp;Items that are
          existing to the supplier will not be assigned again!
        </span>
      </div>
      <div className="p-2 w-50">
        <DropDownSearchSupplier
          label="Store"
          sizes="xs"
          placeholder="Search supplier.."
          onSelect={function (supplier: Supplier): void {
            setSelectedSupplier(supplier);
            if (supplier) {
              setItemData(
                itemData?.map((item) => ({
                  ...item, // example field
                  suppId: supplier.suppId,
                  suppItemCreatedBy: user?.userId ?? 0, // assign same suppId here
                })) ?? [],
              );
            }
          }}
        />
      </div>
      {/* Footer buttons */}
      <div className="flex justify-end gap-2 border-t p-3 border-gray-300">
        <div>
          <Button
            icon={X}
            label="Cancel"
            color="secondary"
            size="xs"
            onClick={onCancel}
            className="font-semibold"
          />
        </div>
        <div>
          {" "}
          <Button
            icon={Plus}
            label="Assign Item"
            size="xs"
            className="font-semibold"
            onClick={() => {
              handleSubmit();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemSupplierModal;
