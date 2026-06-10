import { updateISRPurchaser } from "@/models/isrModels";
import { ISRPurchasers } from "@/types/isr";
import { getDateToday } from "@/utils/getDateToday";
import { PoolConnection } from "mysql2/promise";

export async function deleteISRPurchaserByFields({
  connection,
  updates,
  keyFields = ["isrPurId"],
}: // default primary key
{
  connection?: PoolConnection;
  updates: Partial<ISRPurchasers>[];
  keyFields?: (keyof ISRPurchasers)[];
}) {
  const dateToday = getDateToday();
  try {
    const isrPurchaseToDelete: Partial<ISRPurchasers>[] = updates.map((i) => ({
      ...i,
      isrPurDeletedAt: dateToday,
    }));

    await updateISRPurchaser({
      connection,
      updates: isrPurchaseToDelete,
      keyFields,
    });
  } catch (e) {
    throw e;
  }
}

export async function deleteISRPurcahserByID({
  isrPurId,
  connection,
}: {
  isrPurId: number;
  connection?: PoolConnection;
}) {
  try {
    await deleteISRPurchaserByFields({
      connection,
      updates: [{ isrPurId: isrPurId }],
      keyFields: ["isrPurId"],
    });
  } catch (e) {
    throw e;
  }
}
