import { ISRRequestHandlers } from "@/types/isr";
import { getDateToday } from "@/utils/getDateToday";
import { PoolConnection } from "mysql2/promise";
import { updateISRRequestHandlerByFields } from "./update-isr-request-handler";

export async function deleteISRRequestHandlerByFields({
  connection,
  updates,
  keyFields = ["isrReqHanId"],
}: // default primary key
{
  connection?: PoolConnection;
  updates: Partial<ISRRequestHandlers>[];
  keyFields?: (keyof ISRRequestHandlers)[];
}) {
  const dateToday = getDateToday();
  try {
    const isrReqHandToDelete: Partial<ISRRequestHandlers>[] = updates.map(
      (i) => ({
        ...i,
        isrReqHanDeletedAt: dateToday,
      }),
    );

    await updateISRRequestHandlerByFields({
      connection,
      updates: isrReqHandToDelete,
      keyFields,
    });
  } catch (e) {
    throw e;
  }
}

export async function deleteISRRequestHandlerByID({
  isrReqHanId,
  connection,
}: {
  isrReqHanId: number;
  connection?: PoolConnection;
}) {
  try {
    await deleteISRRequestHandlerByFields({
      connection,
      updates: [{ isrReqHanId: isrReqHanId }],
      keyFields: ["isrReqHanId"],
    });
  } catch (e) {
    throw e;
  }
}
