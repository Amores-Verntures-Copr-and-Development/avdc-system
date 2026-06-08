import {
  selectCountISRPurchaser,
  selectISRPurchaser,
} from "@/models/isrModels";
import { InterStoreRequests, ISRPurchasers } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";

export async function getISRPurchaser({
  connection,
  keyFields = {},
  code,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof ISRPurchasers, any>>;
  code?: string;
}) {
  const data = await selectISRPurchaser({ connection, keyFields, code });
  const count = await selectCountISRPurchaser({ connection, keyFields, code });
  return {
    data: data,
    count: count,
  };
}
