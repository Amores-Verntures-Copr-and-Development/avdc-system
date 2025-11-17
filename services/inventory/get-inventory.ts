import {
  selectInventory,
  selectInventoryByStockPurchaserFields,
  selectInventoryByStoreFields,
  selectInventoryItems,
} from "@/models/inventoryModels";
import { InventoryInterface } from "@/types/inventory";
import { StockPurchasers } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";

export async function findInventoryByFields({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryInterface>; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventory({ keyFields });
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
}: {
  keyFields?: Partial<StoreInterface>; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventoryByStoreFields({ keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}

// export async function findAllInventory(params: type) {}
