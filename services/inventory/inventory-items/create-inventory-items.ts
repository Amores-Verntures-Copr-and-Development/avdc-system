import { CreateInventoryItemDto } from "@/dtos/inventory.dto";
import {
  insertInventoryItem,
  insertInventoryItemsBulk,
} from "@/models/inventoryModels";
import { PoolConnection } from "mysql2/promise";

export async function createInventoryItems({
  connection,
  data,
}: {
  data: CreateInventoryItemDto[];
  connection?: PoolConnection;
}) {
  try {
    const res = await insertInventoryItemsBulk({ connection, data });
    return res;
  } catch (e) {
    throw e;
  }
}

export async function createInventoryItem({
  connection,
  data,
}: {
  data: CreateInventoryItemDto;
  connection?: PoolConnection;
}) {
  try {
    const result = await insertInventoryItem({ connection, data });

    if (result.affectedRows === 0) {
      throw new Error("Item is already in your inventory!");
    }
    return result.insertId;
  } catch (e) {
    throw e;
  }
}
