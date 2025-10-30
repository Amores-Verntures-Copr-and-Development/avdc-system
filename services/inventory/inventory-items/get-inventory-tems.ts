import {
  selectInventoryItems,
  selectInventoryItemsStockStatus,
} from "@/models/inventoryModels";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";

export async function findInventoryItemsByField({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryItemInterface>; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventoryItems({ keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getInventoryItemsStatus(inventoryId: number) {
  try {
    const data = await selectInventoryItemsStockStatus(inventoryId);
    return data;
  } catch (e) {
    throw e;
  }
}
