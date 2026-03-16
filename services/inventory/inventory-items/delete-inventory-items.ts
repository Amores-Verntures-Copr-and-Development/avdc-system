import {
  updateInventoryItems,
  UpdateInventoryQtyMode,
} from "@/models/inventoryModels";
import { InventoryItemInterface } from "@/types/inventory";
import { getDateToday } from "@/utils/getDateToday";
import { PoolConnection } from "mysql2/promise";

export async function deleteInventoryItems({
  connection,
  updates,
  keyFields = ["inventoryItemId"],
}: // default primary key
{
  connection?: PoolConnection;
  updates: Partial<InventoryItemInterface>[];
  keyFields?: (keyof InventoryItemInterface)[];
}) {
  const dateToday = getDateToday();
  try {
    const itemToDelete: Partial<InventoryItemInterface>[] = updates.map(
      (item) => ({
        inventoryItemId: item.inventoryItemId,
        inventoryItemDeletedAt: dateToday,
      }),
    );

    await updateInventoryItems({
      connection,
      updates: itemToDelete,
      keyFields,
    });
  } catch (e) {
    throw e;
  }
}
