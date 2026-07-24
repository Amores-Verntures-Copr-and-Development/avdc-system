import { CreateOrderItemDto } from "@/dtos/orders.dto";
import { insertOrderItems } from "@/models/orderItemModel";
import { PoolConnection } from "mysql2/promise";

export async function createOrderItems({
  connection,
  orderId,
  data,
}: {
  connection?: PoolConnection;
  orderId: number;
  data: CreateOrderItemDto[];
}) {
  try {
    const result = await insertOrderItems({ connection, orderId, data });
    return result;
  } catch (e) {
    throw e;
  }
}
