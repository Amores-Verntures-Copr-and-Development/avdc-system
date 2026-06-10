import { CreateISRRequestHandlerDto } from "@/dtos/isr.dto";
import {
  insertISRRequestHandler,
  selectISRRequestHandler,
} from "@/models/isrModels";
import { ISRRequestHandlers } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";
import { getISRRequestHandler } from "./get-isr-request-handler";
import { updateISRRequestHandlerByFields } from "./update-isr-request-handler";

export async function createISRRequestHandler({
  data,
  connection,
}: {
  data: CreateISRRequestHandlerDto;
  connection?: PoolConnection;
}) {
  try {
    const isExisting = await getISRRequestHandler({
      keyFields: {
        userId: data.userId,
        isrId: data.isrId,
        isrReqHanDeletedAt: "NOTNULL",
      },
    });
    if (isExisting.data.length > 0) {
      updateISRRequestHandlerByFields({
        connection,
        updates: [
          {
            isrId: data.isrId,
            userId: data.userId,
            isrReqHanDeletedAt: null,
          },
        ],
        keyFields: ["userId", "isrId"],
      });

      return;
    }
    await insertISRRequestHandler({ data, connection });
    return;
  } catch (e) {
    throw e;
  }
}
