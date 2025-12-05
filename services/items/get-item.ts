import { selectItemsByFields } from "@/models/itemModel";
import { ItemInterface } from "@/types/items";
import { PoolConnection } from "mysql2/promise";

export async function findItemsByFields({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<ItemInterface>;
}) {
  try {
    const data = await selectItemsByFields({ connection, keyFields });
    return data;
  } catch (e) {
    console.log(e);
    throw e;
  }
}
