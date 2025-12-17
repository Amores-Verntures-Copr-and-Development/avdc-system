import { CreatePurchaseOrderItemDto } from "@/dtos/purchase.dto";
import { insertPurchaseOrderItems } from "@/models/purchaseOrderModel";
import { insertRequestItemsBulk } from "@/models/requestModel";
import { PoolConnection } from "mysql2/promise";

export async function createPurchaseOrderItem({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreatePurchaseOrderItemDto[];
}) {
  try {
    await insertPurchaseOrderItems({ connection, data });
  } catch (e) {
    throw e;
  }
}
