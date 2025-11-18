import { CreateItemDto } from "@/dtos/items.dto";
import { insertItem } from "@/models/itemModel";

import { PoolConnection } from "mysql2/promise";

export async function createItem({
  data,
  connection,
}: {
  data: CreateItemDto;
  connection?: PoolConnection;
}) {
  try {
    const id = await insertItem({ connection, data });
    return id;
  } catch (e) {
    throw e;
  }
}
