import { UpdatePurchaseOrdersDto } from "@/dtos/purchase.dto";
import { updatePurchaseOrder } from "@/models/purchaseOrderModel";
import { PoolConnection } from "mysql2/promise";

export async function updatePurchase({
  connection,
  updates,
  keyFields = ["poId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<UpdatePurchaseOrdersDto>[];
  keyFields?: (keyof UpdatePurchaseOrdersDto)[]; // which fields define the WHERE condition
}) {
  try {
    await updatePurchaseOrder({
      connection,
      keyFields: keyFields,
      updates: updates,
    });
  } catch (e) {
    throw e;
  }
}
