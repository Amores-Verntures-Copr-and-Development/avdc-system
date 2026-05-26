import { selectItemsByFields } from "@/models/itemModel";
import { ItemInterface } from "@/types/items";
import { PoolConnection } from "mysql2/promise";

export async function findItemsByFields({
  connection,
  keyFields = {},
  arrayFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<ItemInterface>;
  arrayFields?: { [key: string]: any[] };
}) {
  try {
    const data = await selectItemsByFields({
      connection,
      keyFields,
      arrayFields,
    });
    return data;
  } catch (e) {
    console.log(e);
    throw e;
  }
}
