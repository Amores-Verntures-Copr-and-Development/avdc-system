import { selectItemConversionFromFields } from "@/models/itemModel";
import { ItemConversions } from "@/types/items";
import { PoolConnection } from "mysql2/promise";

export async function getItemConversionByFields({
  connection,
  keyFields,
}: {
  connection?: PoolConnection;
  keyFields: Partial<ItemConversions>;
}) {
  try {
    const data = await selectItemConversionFromFields({
      connection,
      keyFields,
    });
    return data;
  } catch (e) {
    throw e;
  }
}
