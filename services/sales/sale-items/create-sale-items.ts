import { CreateSaleItemDto } from "@/dtos/sales.dto";
import { insertSaleItems } from "@/models/saleModel";

import { PoolConnection } from "mysql2/promise";

export async function createSaleItems({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateSaleItemDto[];
}) {
  try {
    const res = await insertSaleItems({ connection, data });
    return res;
  } catch (e) {
    throw e;
  }
}
