import { CreateOrderDto } from "@/dtos/orders.dto";
import { getDBConnection } from "@/lib/db";
import { insertOrder } from "@/models/orderModel";
import { insertOrderItems } from "@/models/orderItemModel";
import { insertOrderStatusHistory } from "@/models/orderStatusHistoryModel";
import { generateOrderNumber } from "./generate-order-number";
import { customerServices } from "../customer/customerServices";
import { redeemVouchersForOrder } from "../vouchers/redeem-vouchers";
import crypto from "crypto";

export async function processCreateOrder(
  data: CreateOrderDto,
  createdBy?: number | null,
) {
  if (!data.items || data.items.length === 0) {
    throw new Error("Order must have at least one item");
  }

  if (data.customerId) {
    const customers = await customerServices.findCustomerByFields({
      keyFields: { customerId: data.customerId },
    });

    if (!customers || customers.length === 0) {
      throw new Error("Customer not found");
    }
  }

  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const orderNumber = await generateOrderNumber({
      connection,
      storeId: data.storeId,
    });
    const orderPublicId = crypto.randomUUID();

    const orderId = await insertOrder({
      connection,
      data,
      orderNumber,
      orderPublicId,
    });

    await insertOrderItems({ connection, orderId, data: data.items });

    await redeemVouchersForOrder({
      connection,
      orderId,
      storeId: data.storeId,
      createdBy,
      vouchers: data.vouchers,
    });

    await insertOrderStatusHistory({
      connection,
      data: {
        orderId,
        orderStatus: data.orderStatus ?? "PENDING",
        note: "Order placed",
        changedBy: createdBy ?? null,
      },
    });

    await connection.commit();

    return { orderId, orderNumber };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
