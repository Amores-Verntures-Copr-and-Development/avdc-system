import { DisplayAllInventory } from "@/app/inventory/InventoryPage";
import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import Input from "@/components/shared/Input";
import { CreatePurchaseOrderItemDto } from "@/dtos/purchase.dto";
import { UserAuth } from "@/hooks/useSession";
import { ItemInterface } from "@/types/items";
import { StockRoom } from "@/types/stockRoom";
import { fetcher } from "@/utils/fetcher";
import React, { useState } from "react";
import useSWR from "swr";

interface AddItemToPoModalProps {
  poId: number;
  user: UserAuth | null;
}
const AddItemToPoModal = ({ poId, user }: AddItemToPoModalProps) => {
  const [form, setForm] = useState<CreatePurchaseOrderItemDto>({
    poId: 0,
    itemId: 0,
    poItemOrderedQty: 0,
    poItemReceivedQty: 0,
    unitPrice: 0,
  });
  const {
    data: stockRoomResponse = { data: [] },
    isLoading: isStockRoomLoading,
  } = useSWR<{
    data: StockRoom[];
  }>(user ? `/api/stock-room/userId/${user?.userId}` : null, fetcher);

  return (
    <div className="flex flex-col h-full gap-2">
      <span className="text-sm">
        <span className="font-semibold">Note:</span> Search and select item in
        inventory to add in purchaser order.
      </span>
      <div className="flex gap-2">
        <DropDownSearchItem
          label="Item"
          onSelect={function (item: ItemInterface): void {
            throw new Error("Function not implemented.");
          }}
          sizes="xs"
        />
        <Input label={"Quantity Requested"} sizes="xs" />
      </div>
      <div className="flex justify-end gap-4 mt-auto">
        <div>
          <Button label="Cancel" size="sm" />
        </div>
        <div>
          <Button label="Add" size="sm" />
        </div>
      </div>
    </div>
  );
};

export default AddItemToPoModal;
