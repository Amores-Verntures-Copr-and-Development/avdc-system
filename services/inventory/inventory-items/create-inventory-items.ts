import { CreateInventoryItemDto, CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import {
  insertInventoryItem,
  insertInventoryItemsBulk,
} from "@/models/inventoryModels";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { createInventoryMovement } from "../inventory-movement/create-inventory-movement";

export async function createInventoryItems({
  connection,
  data,
}: {
  data: CreateInventoryItemDto[];
  connection?: PoolConnection;
}) {
  try {
    const res = (await insertInventoryItemsBulk({
      connection,
      data,
    })) as ResultSetHeader;

    // MySQL guarantees contiguous auto-increment ids for a single
    // multi-row INSERT, so the Nth row's id is insertId + N.
    const startingStockMovements: CreateInventoryMovementDto[] = data
      .map((item, index) => ({
        inventoryId: item.inventoryId,
        inventoryItemId: res.insertId + index,
        itemMovementReference: "initial" as const,
        itemMovementQuantity: Number(item.inventoryItemQuantity),
        itemMovementReferenceId: null,
        itemMovementType: "in" as const,
        itemMovementRemarks: "Starting stock",
      }))
      .filter((movement) => movement.itemMovementQuantity > 0);

    if (startingStockMovements.length > 0) {
      await createInventoryMovement({
        connection,
        data: startingStockMovements,
      });
    }

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

    if (Number(data.inventoryItemQuantity) > 0) {
      await createInventoryMovement({
        connection,
        data: [
          {
            inventoryId: data.inventoryId,
            inventoryItemId: result.insertId,
            itemMovementReference: "initial",
            itemMovementQuantity: Number(data.inventoryItemQuantity),
            itemMovementReferenceId: null,
            itemMovementType: "in",
            itemMovementRemarks: "Starting stock",
          },
        ],
      });
    }

    return result.insertId;
  } catch (e) {
    throw e;
  }
}
