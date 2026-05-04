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
import { ItemInterface } from "@/types/items";
import {
  handleUpdateItemPrice,
  handleUpdateItems,
} from "@/services/items/update-items";
import { findItemsByFields } from "@/services/items/get-item";

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
        inventoryItemId: inventoryItem.data[0].inventoryItemId,
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
        itemMovementReferenceId: inventoryItem.data[0].inventoryItemId,
        itemMovementType: "out",
      },
      {
        inventoryId: data.inventoryId,
        inventoryItemId: inventoryItem.data[0].inventoryItemId,
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

export async function handleUpdateItemOrInventory({
  itemData,
  inventoryData,
}: {
  itemData: Partial<ItemInterface>[];
  inventoryData: Partial<InventoryItemInterface>[];
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (itemData && itemData.length > 0 && itemData[0] !== undefined) {
      //update item
      const item = await findItemsByFields({
        connection,
        keyFields: { itemId: itemData[0].itemId },
      });
      const isSamePrice =
        Number(item[0].itemPrice) === Number(itemData[0].itemPrice);

      const updateItem: Partial<ItemInterface>[] = [
        {
          itemId: itemData[0].itemId,
          itemUnit: itemData[0].itemUnit,
          itemName: itemData[0].itemName,
        },
      ];
      if (!isSamePrice) {
        const updateItemPriceData: Partial<ItemInterface>[] = [
          {
            itemId: itemData[0].itemId,
            itemPrice: itemData[0].itemPrice,
            itemAddedBy: itemData[0].itemAddedBy,
          },
        ];

        await handleUpdateItems({
          connection,
          updates: updateItem,
          keyFields: ["itemId"],
        });
        await handleUpdateItemPrice({
          connection,
          updates: updateItemPriceData,
        });
      } else {
        await handleUpdateItems({
          connection,
          updates: updateItem,
          keyFields: ["itemId"],
        });
      }
    }
    if (
      inventoryData ||
      (inventoryData > 0 && inventoryData[0] !== undefined)
    ) {
      //update inventory
      await updateInventoryItems({
        connection,
        updates: inventoryData,
        keyFields: ["inventoryItemId"],
      });
    }
    await connection.commit();
    return;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
