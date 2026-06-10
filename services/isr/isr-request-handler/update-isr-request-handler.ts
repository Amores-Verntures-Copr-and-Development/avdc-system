import { updateISRRequestHandlerModel } from "@/models/isrModels";
import { ISRRequestHandlers } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";

export async function updateISRRequestHandlerByFields({
  connection,
  updates,
  keyFields = ["isrReqHanId"],
}: {
  connection?: PoolConnection;
  updates: Partial<ISRRequestHandlers>[];
  keyFields?: (keyof ISRRequestHandlers)[];
}) {
  return await updateISRRequestHandlerModel({ connection, updates, keyFields });
}
