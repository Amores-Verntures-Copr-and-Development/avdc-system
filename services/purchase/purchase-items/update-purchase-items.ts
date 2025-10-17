import { updatePOItems } from "@/models/purchaseOrderModel";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { PoolConnection } from "mysql2/promise";

export async function updatePurchaseOrderItems({
  connection,
  updates,
  keyFields = ["poItemId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<PurchaseOrderItems>[];
  keyFields?: (keyof PurchaseOrderItems)[]; // which fields define the WHERE condition
}) {
  try {
    await updatePOItems({
      connection,
      updates: updates,
      keyFields: keyFields,
    });
  } catch (e) {
    throw e;
  }
}
