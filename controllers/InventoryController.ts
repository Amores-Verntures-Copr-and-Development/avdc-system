import { selectStores } from "../models/storeModels";
import {
  CreateFirstItem,
  CreateInventoryDto,
  CreateInventoryItemDto,
} from "@/dtos/inventory.dto";
import {
  insertInventory,
  insertInventoryItem,
  selectInventory,
  selectInventoryItems,
} from "../models/inventoryModels";
import { handleCreateItem } from "../services/itemServices";
import { getDBConnection } from "../lib/db";
import { CreateItemDto } from "@/dtos/items.dto";
import { PoolConnection } from "mysql2/promise";
import {
  handleFindInventoryByStoreId,
  handleInsertItemInventory,
  handleInsertItemInventoryBulk,
} from "../services/inventoryItemServices";
import { AddItemToStoreDto } from "@/app/inventory/InventoryPage";
import { InventoryInterface } from "@/types/inventory";
import { findIventoryByFields } from "@/services/inventory/get-inventory";
import { findInventoryItemsByField } from "@/services/inventory/inventory-items/get-inventory-tems";

export const createInventory = async (data: CreateInventoryDto) => {
  try {
    await insertInventory(data);
    return {
      success: true,
      message: "Inventory created successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create inventory!",
      error: e,
    };
  }
};
export const getInventory = async ({
  storeId = null,
}: {
  storeId?: number | null;
}) => {
  try {
    console.log("StoreId: ", storeId);
    const data = await findIventoryByFields({ keyFields: { storeId } });
    return {
      success: true,
      message: "Inventory fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched Inventory!",
      error: e,
    };
  }
};

export const createInventoryItem = async (data: CreateInventoryItemDto) => {
  try {
    await insertInventoryItem({ data });
    return {
      success: true,
      message: "Item added to inventory successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add item in inventory!",
      error: e,
    };
  }
};
export const getInventoryItems = async (inventoryId: number) => {
  try {
    const data = await findInventoryItemsByField({
      keyFields: { inventoryId },
    });
    return {
      success: true,
      message: "Item fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched Item!",
      error: e,
    };
  }
};

export const addItemToInventory = async (data: CreateFirstItem) => {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    if (!data) {
      return {
        success: false,
        message: "No data found!",
      };
    }
    const itemData: CreateItemDto = {
      categoryId: data.categoryId,
      itemAddedBy: data.itemAddedBy,
      itemName: data.itemName,
      itemPrice: data.itemPrice,
      itemUnit: data.itemUnit,
      itemDescription: data.itemDescription,
    };
    const itemId = await handleCreateItem(connection, itemData);
    const inventoryItemData: CreateInventoryItemDto = {
      ...data,
      inventoryItemReferenceId: itemId,
      inventoryItemReferenceType: "item",
    };
    await handleInsertItemInventory(connection, inventoryItemData);
    await connection.commit();
    return {
      success: true,
      message: "Item fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    await connection.rollback();
    return {
      success: false,
      message: "Failed to add item in inventory!",
      error: e,
    };
  } finally {
    connection.release();
  }
};

export const addItemToStoreInventory = async (data: AddItemToStoreDto) => {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const storeInventory: InventoryInterface[] =
      await handleFindInventoryByStoreId({
        storeId: data.storeId,
      });
    if (!storeInventory) {
      throw new Error("No inventory found for that store");
    }
    const storeInventoryId = storeInventory[0].inventoryId;
    const newData: CreateInventoryItemDto[] = data.items.map((item) => ({
      inventoryId: storeInventoryId,
      inventoryItemReferenceType: "item", // <-- adjust if you have other types
      inventoryItemReferenceId: item.inventoryItemReferenceId,
      inventoryItemQuantity: item.inventoryItemQuantity,
      inventoryItemMin: item.inventoryItemMin,
      inventoryItemCreatedBy: data.addedById,
    }));
    await handleInsertItemInventoryBulk(connection, newData);
    await connection.commit();
    return {
      success: true,
      message: "Item add successfully!",
    };
  } catch (e) {
    await connection.rollback();
    return {
      success: false,
      message: "Failed to add item!",
      error: e,
    };
  } finally {
    connection.release();
  }
};
