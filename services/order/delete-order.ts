import { updateOrders } from "@/models/orderModel";
import { Orders } from "@/types/orders";
import { PoolConnection } from "mysql2/promise";

export async function deleteOrder({
  connection,
  orderId,
}: {
  connection?: PoolConnection;
  orderId: number;
}) {
  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const data: Partial<Orders>[] = [{ orderId, orderDeletedAt: now }];

    const result = await updateOrders({
      connection,
      updates: data,
      keyFields: ["orderId"],
    });
    return result;
  } catch (e) {
    throw e;
  }
}
