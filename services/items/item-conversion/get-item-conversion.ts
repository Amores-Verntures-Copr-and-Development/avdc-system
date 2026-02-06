import { DisplayItemConversionFromTo } from "@/dtos/items.dto";
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

    // Normalize conversions so that fromItemId always matches the requested fromItemId
    const normalized = data.map((row) => {
      // Only reverse if fromItemId is different from requested fromItemId
      if (keyFields.fromItemId && row.fromItemId !== keyFields.fromItemId) {
        return {
          ...row,
          fromItemId: row.toItemId,
          toItemId: row.fromItemId,
          fromUnit: row.toUnit,
          fromItemPrice: row.fromItemPrice,
          toUnit: row.fromUnit,
          fromQuantity: row.toQuantity,
          toQuantity: row.fromQuantity,
          toItemPrice: row.toItemPrice,
        };
      }
      return row;
    });

    return normalized;
  } catch (e) {
    throw e;
  }
}
