import {
  selectPurchaserOrderItems,
  selectStoreItemsBySupplierAndPOId,
} from "@/models/purchaseOrderModel";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { PoolConnection } from "mysql2/promise";

export async function findStoreItemsBySupplierAndPOIds({
  suppId,
  poId,
}: {
  poId: number;
  suppId: number;
}) {
  try {
    const data = await selectStoreItemsBySupplierAndPOId({ suppId, poId });
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
