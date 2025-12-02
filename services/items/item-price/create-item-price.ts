import { CreateItemPriceDto } from "@/dtos/items.dto";
import { insertItemPrice } from "@/models/itemModel";
import { PoolConnection } from "mysql2/promise";

export async function createItemPrice({
  data,
  connection,
}: {
  connection: PoolConnection;
  data: CreateItemPriceDto[];
}) {
  try {
    const result = await insertItemPrice({ connection, data });
    return result;
  } catch (e) {
    throw e;
  }
}
