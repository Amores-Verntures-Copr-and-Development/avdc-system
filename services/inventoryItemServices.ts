import { CreateInventoryItemDto, CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import {
  insertInventoryItem,
  insertInventoryItemsBulk,
  selectInventory,
} from "../models/inventoryModels";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
import { createInventoryMovement } from "./inventory/inventory-movement/create-inventory-movement";

export async function handleInsertItemInventory(
  connection: PoolConnection,
  data: CreateInventoryItemDto
) {
  if (!data) {
    return new Error("No data found!");
  }
  const id = (await insertInventoryItem({ connection, data })) as ResultSetHeader;

  if (id.affectedRows > 0 && Number(data.inventoryItemQuantity) > 0) {
    await createInventoryMovement({
      connection,
      data: [
        {
          inventoryId: data.inventoryId,
          inventoryItemId: id.insertId,
          itemMovementReference: "initial",
          itemMovementQuantity: Number(data.inventoryItemQuantity),
          itemMovementReferenceId: null,
          itemMovementType: "in",
          itemMovementRemarks: "Starting stock",
        },
      ],
    });
  }

  return id;
}

export async function handleInsertItemInventoryBulk(
  connection: PoolConnection,
  data: CreateInventoryItemDto[]
) {
  if (!data) {
    return new Error("No data found!");
  }
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
      itemMovementReference: "stocking" as const,
      itemMovementQuantity: Number(item.inventoryItemQuantity),
      itemMovementReferenceId: null,
      itemMovementType: "in" as const,
      itemMovementRemarks: "Stocked into inventory",
    }))
    .filter((movement) => movement.itemMovementQuantity > 0);

  if (startingStockMovements.length > 0) {
    await createInventoryMovement({
      connection,
      data: startingStockMovements,
    });
  }

  return res;
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
    keyFields: { inventoryReference: "store", inventoryReferenceId: storeId },
  });

  return inventory;
}
