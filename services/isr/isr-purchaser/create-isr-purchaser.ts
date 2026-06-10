import { CreateISRPurchaserDto } from "@/dtos/isr.dto";
import { insertISRPurchaser } from "@/models/isrModels";
import { PoolConnection } from "mysql2/promise";
import { getISRPurchaser } from "./get-isr-purchaser";
import { updateISRPurchaserByFields } from "./update-isr-purchaser";

export async function createISRPurchaser({
  data,
  connection,
}: {
  data: CreateISRPurchaserDto;
  connection?: PoolConnection;
}) {
  try {
    const existing = await getISRPurchaser({
      connection,
      keyFields: { userId: data.userId, isrPurDeletedAt: "NOTNULL" },
    });

    if (existing.data.length > 0) {
      updateISRPurchaserByFields({
        connection,
        updates: [
          {
            isrPurId: existing.data[0].isrPurId,
            isrPurDeletedAt: null,
          },
        ],
        keyFields: ["isrPurId"],
      });
      return;
    }
    await insertISRPurchaser({ data, connection });
    return;
  } catch (e) {
    throw e;
  }
}
