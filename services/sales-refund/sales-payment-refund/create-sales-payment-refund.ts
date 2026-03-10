import { CreateSalePaymentRefundDto } from "@/dtos/sales-refund.dto";
import { insertSalesPaymentRefunds } from "@/models/salesRefundModel";
import { PoolConnection } from "mysql2/promise";

export async function createSalesPaymentRefund({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSalePaymentRefundDto[];
}) {
  try {
    const result = await insertSalesPaymentRefunds({ data, connection });
    return result;
  } catch (e) {
    throw e;
  }
}
