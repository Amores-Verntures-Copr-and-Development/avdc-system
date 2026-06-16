import {
  selectCountInventoryItemsNotInOther,
  selectInventoryItemReport,
  selectInventoryItems,
  selectInventoryItemsCount,
  selectInventoryItemsNotInOther,
  selectInventoryItemsNotInProdVar,
  selectInventoryItemsStockStatus,
  selectInventoryItemUnitById,
  selectStockRoomInventoryItems,
} from "@/models/inventoryModels";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
import { PoolConnection } from "mysql2/promise";
import { findInventoryByFields } from "../get-inventory";

export async function findInventoryItemsByField({
  keyFields = {},
  search,
  status,
  category,
  unit,
  connection,
  limit,
  offset,
  movement,
  supplier,
}: {
  keyFields?: Partial<InventoryItemInterface>;
  search?: string;
  status?: string;
  category?: string;
  unit?: string;
  connection?: PoolConnection;
  limit?: number;
  offset?: number;
  movement?: string;
  supplier?: string;
  // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventoryItems({
      keyFields,
      search,
      status,
      category,
      unit,
      limit,
      offset,
      connection,
      movement,
      supplier,
    });
    const total = await selectInventoryItemsCount({
      keyFields,
      search,
      status,
      category,
      unit,
      connection,
      movement,
      supplier,
    });
    // console.log("total[0].totalItemsL ", total[0].totalItems);
    return {
      data: data as InventoryItemInterface[],
      total: total[0].totalItems,
    };
  } catch (e) {
    throw e;
  }
}

export async function findInventoryItemsCount({
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
  connection?: PoolConnection;
}) {
  try {
    const data = await selectInventoryItemsCount({
      keyFields,
      search,
      status,
      category,
      unit,
      connection,
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

export async function findInventoryNotInProduct({
  storeId,
}: {
  storeId: number;
}) {
  try {
    const inventory = await findInventoryByFields({
      keyFields: { inventoryReferenceId: storeId, inventoryReference: "store" },
    });

    if (inventory.length === 0) {
      throw new Error("No inventory found in this store!");
    }

    const data = await selectInventoryItemsNotInProdVar({
      inventoryId: inventory[0].inventoryId,
    });

    return data;
  } catch (e) {
    throw e;
  }
}

export async function findInventoryItemsNotInStore({
  storeId,
  inventoryId,
  limit,
  skip,
  connection,
}: {
  inventoryId: number;
  storeId: number;
  limit?: number;
  skip?: number;
  connection?: PoolConnection;
}) {
  try {
    const inventory = await findInventoryByFields({
      keyFields: { inventoryReferenceId: storeId, inventoryReference: "store" },
      connection,
    });
    if (inventory.length === 0) {
      throw new Error("No inventory found!");
    }
    const storeInventory = inventory[0].inventoryId;
    const data = await selectInventoryItemsNotInOther({
      from: storeInventory,
      notIn: inventoryId,
      limit,
      skip,
      connection,
    });

    const count = await selectCountInventoryItemsNotInOther({
      from: storeInventory,
      notIn: inventoryId,
      limit,
      skip,
      connection,
    });
    return {
      data: data,
      count: count,
    };
  } catch (e) {
    console.log({ e });
    throw e;
  }
}
