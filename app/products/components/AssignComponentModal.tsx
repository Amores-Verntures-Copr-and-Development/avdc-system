import { DropdownSearch } from "@/components/shared/DropDownSearch";
import Input from "@/components/shared/Input";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import React from "react";

interface AssignComponentModalProps {
  storeId: number;
}

const AssignComponentModal = ({ storeId }: AssignComponentModalProps) => {
  // const {} = useInventoryItems({ id:2, search:, reference: "storeId" });
  const searchItems = async (
    query: string
  ): Promise<DisplayInventoryItems[]> => {
    const res = await fetch(
      `api/inventory/store/${storeId}/item?search=${encodeURIComponent(query)}`
    );
    const json = await res.json();
    return json.data.data || [];
  };
  // const [formData, setFormData] = useState<CreateVarianComponentDto>({
  //   prodVarId: 0,
  //   inventoryItemId: 0,
  //   quantityRequired: 0,
  // });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col bg-white p-2 shadow r">
        <DropdownSearch<DisplayInventoryItems>
          searchFn={searchItems}
          onSelect={(item) => {
            console.log({ item });
          }}
          renderItem={(item) => (
            <span>
              <span className="font-semibold">{item.itemName}</span>{" "}
              {item.itemUnit} ({item.inventoryItemQuantity}) qty
            </span>
          )}
          displayValue={(item) => `${item.itemName} ${item.itemUnit} `}
          label="Search Inventory Item"
          sizes="xs"
        />
        <Input label={"Required Quantity"} sizes="xs" />
      </div>
    </div>
  );
};

export default AssignComponentModal;
