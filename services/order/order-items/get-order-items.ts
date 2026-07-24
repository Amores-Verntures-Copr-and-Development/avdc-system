import { selectOrderItemsByOrderId } from "@/models/orderItemModel";
import { PoolConnection } from "mysql2/promise";

export async function getOrderItemsByOrderId({
  connection,
  orderId,
}: {
  connection?: PoolConnection;
  orderId: number;
}) {
  try {
    const data = await selectOrderItemsByOrderId({ connection, orderId });
    return data;
  } catch (e) {
    throw e;
  }
}
