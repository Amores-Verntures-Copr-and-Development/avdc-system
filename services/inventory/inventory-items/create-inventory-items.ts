import { CreateInventoryItemDto } from "@/dtos/inventory.dto";
import {
  insertInventoryItem,
  insertInventoryItemsBulk,
} from "@/models/inventoryModels";
import { PoolConnection } from "mysql2/promise";
import { findInventoryItemsByField } from "./get-inventory-items";

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
    const isExisting = await findInventoryItemsByField({
      connection,
      keyFields: {
        inventoryId: data.inventoryId,
        inventoryItemReferenceId: data.inventoryItemReferenceId,
        inventoryItemReferenceType: data.inventoryItemReferenceType,
      },
    });

    if (isExisting.data.length > 0) {
      throw new Error("Item is already in your inventory!");
    }
    const id = await insertInventoryItem({ connection, data: data });
    return id;
  } catch (e) {
    throw e;
  }
}
