import {
  selectPurchaserOrderItems,
  selectStoreItemsBySupplierAndPOId,
} from "@/models/purchaseOrderModel";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { PoolConnection } from "mysql2/promise";

export async function findStoreItemsBySupplierAndPOIds({
  connection,
  suppId,
  poId,
}: {
  connection?: PoolConnection;
  poId: number;
  suppId: number;
}) {
  try {
    const data = await selectStoreItemsBySupplierAndPOId({
      connection,
      suppId,
      poId,
    });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findPurchaserOrder({
  connection,
  keyfields,
}: {
  connection?: PoolConnection;
  keyfields: Partial<PurchaseOrderItems>;
}) {
  try {
    const data = await selectPurchaserOrderItems({ connection, keyfields });
    return data;
  } catch (e) {
    throw e;
  }
}
