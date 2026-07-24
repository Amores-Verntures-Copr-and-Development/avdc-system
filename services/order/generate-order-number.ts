import { selectCountOrders } from "@/models/orderModel";
import { PoolConnection } from "mysql2/promise";

export async function generateOrderNumber({
  connection,
  storeId,
}: {
  connection: PoolConnection;
  storeId: number;
}) {
  const totalOrders = await selectCountOrders({
    connection,
    keyFields: { storeId },
  });

  return `ORD-${(totalOrders + 1).toString().padStart(6, "0")}`;
}
