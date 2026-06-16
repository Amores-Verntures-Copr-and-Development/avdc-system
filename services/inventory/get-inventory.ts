import {
  selectInventory,
  selectInventoryByRequestId,
  selectInventoryByStockPurchaserFields,
  selectInventoryByStoreFields,
  selectInventoryItems,
} from "@/models/inventoryModels";
import { InventoryInterface } from "@/types/inventory";
import { StockPurchasers } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import { Pool, PoolConnection } from "mysql2/promise";

export async function findInventoryByFields({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<InventoryInterface>;
  connection?: PoolConnection; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventory({ keyFields, connection });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findInventoryByStockPurchaserFields({
  keyFields = {},
}: {
  keyFields?: Partial<StockPurchasers>; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventoryByStockPurchaserFields({ keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findInventoryByStoreFields({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<StoreInterface>;
  connection?: PoolConnection; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventoryByStoreFields({ keyFields, connection });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findStoreInventoryByRequestId({
  id,
  connection,
}: {
  id: number;
  connection: PoolConnection;
}) {
  try {
    const data = await selectInventoryByRequestId({ id });
    return data;
  } catch (e) {
    throw e;
  }
}
// export async function findAllInventory(params: type) {}
