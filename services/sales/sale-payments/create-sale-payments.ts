import { CreateSalePaymentDto, CreateSaleItemDto } from "@/dtos/sales.dto";
import { insertSaleItems, insertSalePayments } from "@/models/saleModel";

import { PoolConnection } from "mysql2/promise";

export async function createSalePayments({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateSalePaymentDto[];
}) {
  try {
    const res = await insertSalePayments({ connection, data });
    return res;
  } catch (e) {
    throw e;
  }
}
