import { updateItems } from "@/models/itemModel";
import { ItemInterface } from "@/types/items";
import { PoolConnection } from "mysql2/promise";

export async function handleUpdateItems({
  connection,
  updates,
  keyFields = ["itemId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<ItemInterface>[];
  keyFields?: (keyof ItemInterface)[];
}) {
  try {
    const res = await updateItems({ connection, updates, keyFields });
    return res;
  } catch (e) {
    throw e;
  }
}
