import { selectInventoryMovementItems } from "@/models/inventoryModels";
import {
  InventoryItemInterface,
  InventoryItemMovement,
} from "@/types/inventory";

export async function getInventoryMovement({
  keyFields = {},
  search,
  from,
  to,
  type,
  category,
}: {
  keyFields?: Partial<InventoryItemMovement>;
  search?: string;
  from?: string;
  to?: string;
  type?: string;
  category?: string; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventoryMovementItems({
      keyFields,
      search,
      from,
      to,
      type,
      category,
    });
    return data;
  } catch (e) {
    console.log(e);
    throw e;
  }
}
