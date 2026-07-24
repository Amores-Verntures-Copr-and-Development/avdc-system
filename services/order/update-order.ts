import { UpdateOrderDto } from "@/dtos/orders.dto";
import { updateOrders } from "@/models/orderModel";
import { PoolConnection } from "mysql2/promise";

export async function updateOrderByFields({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: UpdateOrderDto;
}) {
  try {
    const result = await updateOrders({
      connection,
      updates: [data],
      keyFields: ["orderId"],
    });
    return result;
  } catch (e) {
    throw e;
  }
}
