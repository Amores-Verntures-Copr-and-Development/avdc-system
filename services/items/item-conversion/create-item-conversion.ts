import { CreateItemConversionDto } from "@/dtos/items.dto";
import { insertItemConversion } from "@/models/itemModel";
import { PoolConnection } from "mysql2/promise";

export async function createItemConversion({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateItemConversionDto;
}) {
  try {
    const result = await insertItemConversion({ connection, data });
    return result;
  } catch (e) {
    throw e;
  }
}
