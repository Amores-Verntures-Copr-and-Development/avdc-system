import { CreateOrderStatusHistoryDto } from "@/dtos/orders.dto";
import { insertOrderStatusHistory } from "@/models/orderStatusHistoryModel";
import { PoolConnection } from "mysql2/promise";

export async function createOrderStatusHistory({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateOrderStatusHistoryDto;
}) {
  try {
    const result = await insertOrderStatusHistory({ connection, data });
    return result;
  } catch (e) {
    throw e;
  }
}
