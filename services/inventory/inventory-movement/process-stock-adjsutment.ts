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
        itemMovementReason: data.itemMovementReason ?? null,
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

export async function processStockBulkAdjustment(
  data: CreateInventoryMovementDto[]
) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const itemMovementType = data.every(
      (item) => item.itemMovementType === data[0].itemMovementType
    )
      ? data[0].itemMovementType
      : null;
    if (!itemMovementType || itemMovementType === null) {
      throw new Error("No movement type found!");
    }
    const updateInventoryItemData: Partial<InventoryItemInterface>[] = data.map(
      (item) => ({
        inventoryItemId: item.inventoryItemId,
        inventoryItemQuantity: item.itemMovementQuantity,
        inventoryId: item.inventoryId,
      })
    );
    await updateInventoryItem({
      connection,
      keyFields: ["inventoryItemId", "inventoryId"],
      fieldModes: {
        inventoryItemQuantity:
          itemMovementType === "in"
            ? "increment"
            : itemMovementType === "out"
            ? "decrement"
            : "replace",
      },
      updates: updateInventoryItemData,
    });
    const inventoryMovement: CreateInventoryMovementDto[] = data.map(
      (item) => ({
        inventoryId: item.inventoryId,
        inventoryItemId: item?.inventoryItemId ?? 0, // fallback if not found
        itemMovementType: item?.itemMovementType,
        itemMovementReferenceId: 0,
        itemMovementReference: "adjustment",
        itemMovementQuantity: Number(item.itemMovementQuantity),
        itemMovementRemarks: item.itemMovementRemarks,
        itemMovementReason: item.itemMovementReason ?? null,
      })
    );
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
