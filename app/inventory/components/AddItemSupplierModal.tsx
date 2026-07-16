import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { UserAuth } from "@/hooks/useSession";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Button from "@/components/shared/Button";

import Table, { Column } from "@/components/shared/Table";
import Modal from "@/components/shared/Modal";
import { Plus, X } from "lucide-react";
import { DropDownSearchSupplier } from "@/components/shared/DropDownSearchSupplier";
import { Supplier } from "@/types/supplier";
import { CreateSupplierDto, CreateSupplierItemDto } from "@/dtos/supplier.dto";
import CreateSupplierModal from "@/app/suppliers/component/CreateSupplierModal";
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
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);

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
  const applySupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setItemData(
      itemData?.map((item) => ({
        ...item,
        suppId: supplier.suppId,
        suppItemCreatedBy: user?.userId ?? 0,
      })) ?? [],
    );
  };
  const handleCreateSupplier = async (supplierData: CreateSupplierDto) => {
    try {
      const newData: CreateSupplierDto = {
        ...supplierData,
        suppCreatedBy: user?.userId ?? 0,
      };
      const result = await fetch(`/api/suppliers/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message || "Failed to create supplier");
      }
      toast.success(res.message);
      applySupplier({
        suppId: res.data.suppId,
        suppCode: res.data.suppCode,
        suppName: newData.suppName,
        suppContactPerson: newData.suppContactPerson,
        suppEmail: newData.suppEmail,
        suppAddress: newData.suppAddress,
        suppPhone: newData.suppPhone,
        suppStatus: "actice",
        suppCreatedAt: new Date().toISOString(),
        suppUpdatedAt: new Date().toISOString(),
        suppCreatedBy: newData.suppCreatedBy,
      });
      return true;
    } catch (e: any) {
      toast.error(e.message || "Failed to create supplier");
      return false;
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
      <div className="p-2 w-50 flex w-full items-end gap-2">
        <div>
          <DropDownSearchSupplier
            label="Store"
            sizes="xs"
            placeholder="Search supplier.."
            selectedValue={selectedSupplier?.suppName ?? ""}
            onSelect={(supplier: Supplier) => {
              if (supplier) {
                applySupplier(supplier);
              }
            }}
          />
        </div>
        <div>
          <Button
            icon={Plus}
            label="New Supplier"
            color="secondary"
            size="xs"
            className="font-semibold shrink-0"
            onClick={() => setShowCreateSupplier(true)}
          />
        </div>
      </div>

      <Modal
        title="Add supplier"
        subtitle="Create a new supplier to assign this item to"
        isOpen={showCreateSupplier}
        onClose={() => setShowCreateSupplier(false)}
        size="md"
      >
        <CreateSupplierModal
          onSubmit={handleCreateSupplier}
          onCancel={() => setShowCreateSupplier(false)}
        />
      </Modal>
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
