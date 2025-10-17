import { CreateFirstItem } from "@/dtos/inventory.dto";

import { insertItem, selectItems } from "../models/itemModel";
import { PoolConnection } from "mysql2/promise";
import { CreateItemDto } from "@/dtos/items.dto";

export async function handleCreateItem(
  connection: PoolConnection,
  data: CreateItemDto
): Promise<number> {
  const itemId = await insertItem({ connection, data });
  return itemId;
}

export async function findItemsBySearch(search?: string) {
  try {
    const data = await selectItems({ search });
    return data;
  } catch (e) {
    throw e;
  }
}
