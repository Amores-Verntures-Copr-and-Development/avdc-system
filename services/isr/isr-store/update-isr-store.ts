import { updateISRStoresModel } from "@/models/isrModels";
import { ISRStores } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";

export async function updateISRStoreByFields({
  connection,
  updates,
  keyFields = ["isrStoreId"],
}: {
  connection?: PoolConnection;
  updates: Partial<ISRStores>[];
  keyFields?: (keyof ISRStores)[];
}) {
  return await updateISRStoresModel({ connection, updates, keyFields });
}
