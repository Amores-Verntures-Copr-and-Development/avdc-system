import { CreatePurchaseOrderDto } from "@/dtos/purchase.dto";
import { insertPurchaseOrder } from "@/models/purchaseOrderModel";
import { PoolConnection } from "mysql2/promise";

export async function createPurchaseOrder({
  connection,
  purchaseOrder,
}: {
  connection: PoolConnection;
  purchaseOrder: CreatePurchaseOrderDto;
}) {
  try {
    const poId = await insertPurchaseOrder({ connection, data: purchaseOrder });
    return poId;
  } catch (e) {
    throw e;
  }
}
