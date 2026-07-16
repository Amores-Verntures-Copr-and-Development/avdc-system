import { getDBConnection } from "@/lib/db";
import { mergeDuplicateInventoryItems } from "@/models/inventoryModels";
import { InventoryReferenceType } from "@/types/inventory";

export async function resolveDuplicateInventoryItems({
  inventoryId,
  inventoryItemReferenceType,
  inventoryItemReferenceId,
}: {
  inventoryId: number;
  inventoryItemReferenceType?: InventoryReferenceType;
  inventoryItemReferenceId?: number;
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await mergeDuplicateInventoryItems({
      inventoryId,
      inventoryItemReferenceType,
      inventoryItemReferenceId,
      connection,
    });

    await connection.commit();
    return result;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
