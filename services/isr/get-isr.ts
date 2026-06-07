import { selectISR } from "@/models/isrModels";
import { InterStoreRequests } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";

export async function getISRByFields({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof InterStoreRequests, any>>;
}) {
  return await selectISR({ keyFields, connection });
}
