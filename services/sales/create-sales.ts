import { CreateSaleDto } from "@/dtos/sales.dto";
import { insertSales } from "@/models/saleModel";
import { PoolConnection } from "mysql2/promise";

export async function createSale({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSaleDto;
}) {
  try {
    const id = await insertSales({ connection, data });
    return id;
  } catch (e) {
    throw e;
  }
}
