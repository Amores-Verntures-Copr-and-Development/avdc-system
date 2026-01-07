import { CreateSalesDiscount } from "@/dtos/sales.dto";
import { insertSaleDiscounts } from "@/models/saleModel";
import { PoolConnection } from "mysql2/promise";

export async function createSalesDiscounts({
  data,
  connection,
}: {
  data: CreateSalesDiscount[];
  connection: PoolConnection;
}) {
  try {
    const result = await insertSaleDiscounts({ connection, data });
    return result;
  } catch (e) {
    throw e;
  }
}
