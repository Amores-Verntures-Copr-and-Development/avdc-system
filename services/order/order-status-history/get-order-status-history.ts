import { selectOrderStatusHistoryByOrderId } from "@/models/orderStatusHistoryModel";
import { PoolConnection } from "mysql2/promise";

export async function getOrderStatusHistoryByOrderId({
  connection,
  orderId,
}: {
  connection?: PoolConnection;
  orderId: number;
}) {
  try {
    const data = await selectOrderStatusHistoryByOrderId({
      connection,
      orderId,
    });
    return data;
  } catch (e) {
    throw e;
  }
}
