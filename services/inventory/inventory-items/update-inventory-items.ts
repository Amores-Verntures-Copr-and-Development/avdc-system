import {
  ConvertInventoryItems,
  ConvertInventoryItemsDto,
  CreateInventoryMovementDto,
} from "@/dtos/inventory.dto";
import { getDBConnection } from "@/lib/db";
import {
  updateInventoryItems,
  UpdateInventoryQtyMode,
} from "@/models/inventoryModels";
import { InventoryItemInterface } from "@/types/inventory";
import { PoolConnection } from "mysql2/promise";
import { findInventoryItemsByField } from "./get-inventory-items";
import { createInventoryMovement } from "../inventory-movement/create-inventory-movement";

export async function updateInventoryItem({
  connection,
  updates,
  keyFields = ["inventoryItemId"],
  fieldModes = {}, // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<InventoryItemInterface>[];
  keyFields?: (keyof InventoryItemInterface)[];
  fieldModes?: Partial<
    Record<keyof InventoryItemInterface, UpdateInventoryQtyMode>
  >;
}) {
  try {
    await updateInventoryItems({ connection, updates, keyFields, fieldModes });
  } catch (e) {
    throw e;
  }
}

export async function handleConvertItem({
  data,
}: {
  data: ConvertInventoryItemsDto;
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    console.log("Agi diri: ", data);
    //check if there is data both from item and to item

    const inventoryItem = await findInventoryItemsByField({
      connection,
      keyFields: {
        inventoryId: data.inventoryId,
        inventoryItemReferenceId: data.to.itemId,
        inventoryItemReferenceType: "item",
      },
    });

    const fromInventoryItem: Partial<InventoryItemInterface>[] = [
      {
        inventoryId: data.inventoryId,
        inventoryItemId: data.from.inventoryItemId,
        inventoryItemQuantity: data.from.inventoryItemQuantity,
      },
    ];
    const toInventoryItem: Partial<InventoryItemInterface>[] = [
      {
        inventoryId: data.inventoryId,
        inventoryItemId: inventoryItem[0].inventoryItemId,
        inventoryItemQuantity: data.to.inventoryItemQuantity,
      },
    ];
    await updateInventoryItem({
      connection,
      keyFields: ["inventoryItemId", "inventoryId"],
      updates: fromInventoryItem,
      fieldModes: { inventoryItemQuantity: "decrement" },
    });

    await updateInventoryItem({
      connection,
      keyFields: ["inventoryItemId", "inventoryId"],
      updates: toInventoryItem,
      fieldModes: { inventoryItemQuantity: "increment" },
    });

    const itemMovement: CreateInventoryMovementDto[] = [
      {
        inventoryId: data.inventoryId,
        inventoryItemId: data.from.inventoryItemId,
        itemMovementQuantity: Number(data.from.inventoryItemQuantity),
        itemMovementReference: "convert",
        itemMovementReferenceId: inventoryItem[0].inventoryItemId,
        itemMovementType: "out",
      },
      {
        inventoryId: data.inventoryId,
        inventoryItemId: inventoryItem[0].inventoryItemId,
        itemMovementQuantity: data.to.inventoryItemQuantity,
        itemMovementReference: "convert",
        itemMovementReferenceId: data.from.inventoryItemId,
        itemMovementType: "in",
      },
    ];
    await createInventoryMovement({ connection, data: itemMovement });

    //find invetoryItemId base on toItemId
    await connection.commit();
  } catch (e) {
    console.log(e);
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
