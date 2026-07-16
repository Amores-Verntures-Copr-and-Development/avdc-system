import { CreateInventoryItemDto } from "@/dtos/inventory.dto";
import { getDBConnection } from "@/lib/db";
import { findInventoryItemsNotInStore } from "./get-inventory-items";
import { insertItemFromAnother } from "@/models/inventoryModels";
import { findInventoryByFields } from "../get-inventory";

export async function addAllItemsFromStoreToInventory({
  inventoryId,
  storeId,
  userId,
}: {
  inventoryId: number;
  storeId: number;
  userId: number;
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const inventory = await findInventoryByFields({
      keyFields: { inventoryReferenceId: storeId, inventoryReference: "store" },
      connection,
    });
    if (inventory.length === 0) {
      throw new Error("No inventory found!");
    }

    const result = await insertItemFromAnother({
      sourceId: inventory[0].inventoryId,
      targetId: inventoryId,
      userId: userId,
      connection: connection,
    });

    await connection.rollback();
    return result;
  } catch (e) {
    await connection.rollback();
  } finally {
    connection.release();
  }
}
