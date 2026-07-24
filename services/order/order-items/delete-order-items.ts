import { deleteOrderItems } from "@/models/orderItemModel";
import { PoolConnection } from "mysql2/promise";

export async function deleteOrderItemById({
  connection,
  orderItemId,
}: {
  connection?: PoolConnection;
  orderItemId: number;
}) {
  try {
    const result = await deleteOrderItems({
      connection,
      orderItemIds: [orderItemId],
    });
    return result;
  } catch (e) {
    throw e;
  }
}
