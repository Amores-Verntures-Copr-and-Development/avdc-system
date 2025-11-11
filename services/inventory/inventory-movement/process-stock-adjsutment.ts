import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { getDBConnection } from "@/lib/db";
import { updateInventoryItem } from "../inventory-items/update-inventory-items";
import { InventoryItemInterface } from "@/types/inventory";
import { createInventoryMovement } from "./create-inventory-movement";

export async function processStockAdjustment(data: CreateInventoryMovementDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    console.log("Ready for process");
    const updateInventoryItemData: Partial<InventoryItemInterface>[] = [
      {
        inventoryItemId: data.inventoryItemId,
        inventoryItemQuantity: data.itemMovementQuantity,
        inventoryId: data.inventoryId,
      },
    ];
    await updateInventoryItem({
      connection,
      keyFields: ["inventoryItemId", "inventoryId"],
      fieldModes: {
        inventoryItemQuantity:
          data.itemMovementType === "in"
            ? "increment"
            : data.itemMovementType === "out"
            ? "decrement"
            : "replace",
      },
      updates: updateInventoryItemData,
    });
    const inventoryMovement: CreateInventoryMovementDto[] = [
      {
        inventoryId: data.inventoryId,
        inventoryItemId: data?.inventoryItemId ?? 0, // fallback if not found
        itemMovementType: data?.itemMovementType,
        itemMovementReferenceId: 0,
        itemMovementReference: "adjustment",
        itemMovementQuantity: Number(data.itemMovementQuantity),
        itemMovementRemarks: data.itemMovementRemarks,
      },
    ];
    await createInventoryMovement({ connection, data: inventoryMovement });
    //Insert inventory Movement
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
