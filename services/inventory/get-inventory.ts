import {
  selectInventory,
  selectInventoryItems,
} from "@/models/inventoryModels";
import { InventoryInterface } from "@/types/inventory";

export async function findIventoryByFields({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryInterface>; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventory({ keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}

// export async function findAllInventory(params: type) {}
