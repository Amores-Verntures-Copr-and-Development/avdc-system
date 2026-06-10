import { updateISRPurchaser } from "@/models/isrModels";
import { ISRPurchasers } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";

export async function updateISRPurchaserByFields({
  connection,
  updates,
  keyFields = ["isrPurId"],
}: {
  connection?: PoolConnection;
  updates: Partial<ISRPurchasers>[];
  keyFields?: (keyof ISRPurchasers)[];
}) {
  return await updateISRPurchaser({ connection, updates, keyFields });
}
