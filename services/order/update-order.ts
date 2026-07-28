import { UpdateOrderDto } from "@/dtos/orders.dto";
import { updateOrders } from "@/models/orderModel";
import { insertOrderStatusHistory } from "@/models/orderStatusHistoryModel";
import { PoolConnection } from "mysql2/promise";

export async function updateOrderByFields({
  connection,
  data,
  changedBy,
  note,
}: {
  connection?: PoolConnection;
  data: UpdateOrderDto;
  changedBy?: number | null;
  note?: string | null;
}) {
  try {
    const result = await updateOrders({
      connection,
      updates: [data],
      keyFields: ["orderId"],
    });

    if (data.orderStatus) {
      await insertOrderStatusHistory({
        connection,
        data: {
          orderId: data.orderId,
          orderStatus: data.orderStatus,
          note: note ?? null,
          changedBy: changedBy ?? null,
        },
      });
    }

    return result;
  } catch (e) {
    throw e;
  }
}
