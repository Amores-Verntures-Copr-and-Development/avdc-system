import { ISRStores } from "@/types/isr";
import { getDateToday } from "@/utils/getDateToday";
import { PoolConnection } from "mysql2/promise";
import { updateISRStoreByFields } from "./update-isr-store";

export async function deleteISRStoreByFields({
  connection,
  updates,
  keyFields = ["isrStoreId"],
}: // default primary key
{
  connection?: PoolConnection;
  updates: Partial<ISRStores>[];
  keyFields?: (keyof ISRStores)[];
}) {
  const dateToday = getDateToday();
  try {
    const isrStoreDeleteAt: Partial<ISRStores>[] = updates.map((i) => ({
      ...i,
      isrStoreDeletedAt: dateToday,
    }));

    await updateISRStoreByFields({
      connection,
      updates: isrStoreDeleteAt,
      keyFields,
    });
  } catch (e) {
    throw e;
  }
}

export async function deleteISRStoreByID({
  isrStoreId,
  connection,
}: {
  isrStoreId: number;
  connection?: PoolConnection;
}) {
  try {
    await deleteISRStoreByFields({
      connection,
      updates: [{ isrStoreId: isrStoreId }],
      keyFields: ["isrStoreId"],
    });
  } catch (e) {
    throw e;
  }
}
