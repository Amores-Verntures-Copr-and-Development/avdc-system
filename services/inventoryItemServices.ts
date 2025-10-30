import { CreateInventoryItemDto } from "@/dtos/inventory.dto";
import { PoolConnection } from "mysql2/promise";
import {
  insertInventoryItem,
  insertInventoryItemsBulk,
  selectInventory,
} from "../models/inventoryModels";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";

export async function handleInsertItemInventory(
  connection: PoolConnection,
  data: CreateInventoryItemDto
) {
  if (!data) {
    return new Error("No data found!");
  }
  const id = await insertInventoryItem({ connection, data });
  return id;
}

export async function handleInsertItemInventoryBulk(
  connection: PoolConnection,
  data: CreateInventoryItemDto[]
) {
  if (!data) {
    return new Error("No data found!");
  }
  const id = await insertInventoryItemsBulk({ connection, data });
  return id;
}

export async function handleFindInventoryByStoreId({
  storeId,
  connection,
}: {
  connection?: PoolConnection;
  storeId: number;
}): Promise<InventoryInterface[]> {
  if (!storeId) {
    throw new Error("No storeId provided!");
  }

  // Pass connection if available
  const inventory = await selectInventory({
    keyFields: {
      storeId,
    },
  });

  return inventory;
}
