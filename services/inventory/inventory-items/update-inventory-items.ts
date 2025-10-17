import {
  updateInventoryItems,
  UpdateInventoryQtyMode,
} from "@/models/inventoryModels";
import { InventoryItemInterface } from "@/types/inventory";
import { PoolConnection } from "mysql2/promise";

export async function updateInventoryItem({
  connection,
  updates,
  keyFields = ["inventoryItemId"],
  fieldModes = {}, // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<InventoryItemInterface>[];
  keyFields?: (keyof InventoryItemInterface)[];
  fieldModes?: Partial<
    Record<keyof InventoryItemInterface, UpdateInventoryQtyMode>
  >;
}) {
  try {
    await updateInventoryItems({ connection, updates, keyFields, fieldModes });
  } catch (e) {
    throw e;
  }
}
