import {
  selectInventoryItemReport,
  selectInventoryItems,
  selectInventoryItemsStockStatus,
  selectInventoryItemUnitById,
  selectStockRoomInventoryItems,
} from "@/models/inventoryModels";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
import { PoolConnection } from "mysql2/promise";

export async function findInventoryItemsByField({
  keyFields = {},
  search,
  status,
  category,
  unit,
  connection,
}: {
  keyFields?: Partial<InventoryItemInterface>;
  search?: string;
  status?: string;
  category?: string;
  unit?: string;
  connection?: PoolConnection; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventoryItems({
      keyFields,
      search,
      status,
      category,
      unit,
    });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getInventoryItemsStatus(inventoryId: number) {
  try {
    const data = await selectInventoryItemsStockStatus(inventoryId);
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findStockRoomInventoryByPurchaserId(purchaserId: number) {
  try {
    const data = await selectStockRoomInventoryItems(purchaserId);
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findInventoryItemUnitByInventoryId(invetoryId: number) {
  try {
    const data = await selectInventoryItemUnitById(invetoryId);
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findInventoryForReport({
  range,
  inventoryId,
}: {
  inventoryId: number;
  range: { from: string; to: string };
}) {
  try {
    const data = await selectInventoryItemReport({ range, inventoryId });
    return data;
  } catch (e) {
    throw e;
  }
}
