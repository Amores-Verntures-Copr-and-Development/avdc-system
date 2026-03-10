import { CreateSaleItemRefundDto } from "@/dtos/sales-refund.dto";
import { insertSalesItemRefunds } from "@/models/salesRefundModel";
import { PoolConnection } from "mysql2/promise";

export async function createSalesItemRefund({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSaleItemRefundDto[];
}) {
  try {
    const result = await insertSalesItemRefunds({ data, connection });
    return result;
  } catch (e) {
    throw e;
  }
}
