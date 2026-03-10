import { CreateSalesRefundDto } from "@/dtos/sales-refund.dto";
import { CreateTransactionDto } from "@/dtos/transaction.dto";
import { insertSalesRefund } from "@/models/salesRefundModel";
import { PoolConnection } from "mysql2/promise";

export async function createSalesRefund({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSalesRefundDto;
}) {
  try {
    const result = await insertSalesRefund({ data, connection });
    return result;
  } catch (e) {
    throw e;
  }
}
