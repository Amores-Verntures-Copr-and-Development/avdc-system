import {
  selectCountISRStore,
  selectISRStore,
  selectStoreNotInISR,
} from "@/models/isrModels";
import { InterStoreRequests, ISRStores } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";

export async function getISRStores({
  connection,
  keyFields = {},
  code,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof ISRStores, any>>;
  code?: string;
}) {
  const data = await selectISRStore({ connection, keyFields, code });
  const count = await selectCountISRStore({ connection, keyFields, code });
  return { data: data, count: count };
}

export async function getStoreNotInISR({
  keyFields = {},
  connection,
  limit,
  search,
}: {
  keyFields?: Partial<Record<keyof InterStoreRequests, any>>;
  connection?: PoolConnection;
  limit: number;
  search?: string;
}) {
  return await selectStoreNotInISR({ keyFields, connection, limit, search });
}
