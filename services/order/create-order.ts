import { CreateOrderDto } from "@/dtos/orders.dto";
import { getDBConnection } from "@/lib/db";
import { insertOrder } from "@/models/orderModel";
import { insertOrderItems } from "@/models/orderItemModel";
import { generateOrderNumber } from "./generate-order-number";

export async function processCreateOrder(data: CreateOrderDto) {
  if (!data.items || data.items.length === 0) {
    throw new Error("Order must have at least one item");
  }

  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const orderNumber = await generateOrderNumber({
      connection,
      storeId: data.storeId,
    });

    const orderId = await insertOrder({ connection, data, orderNumber });

    await insertOrderItems({ connection, orderId, data: data.items });

    await connection.commit();

    return { orderId, orderNumber };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
