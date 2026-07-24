import { UpdateOrderItemDto } from "@/dtos/orders.dto";
import { updateOrderItems } from "@/models/orderItemModel";
import { PoolConnection } from "mysql2/promise";

export async function updateOrderItemByFields({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: UpdateOrderItemDto;
}) {
  try {
    const result = await updateOrderItems({
      connection,
      updates: [data],
      keyFields: ["orderItemId"],
    });
    return result;
  } catch (e) {
    throw e;
  }
}
