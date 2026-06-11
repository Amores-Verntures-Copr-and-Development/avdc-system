import { getDBConnection } from "@/lib/db";
import { PoolConnection } from "mysql2/promise";
import { updateRequests } from "./update-request";
import { getDateToday } from "@/utils/getDateToday";
import { updateRequestItems } from "./request-items/update-request-items";

export async function deleteRequestById({
  connection,
  requestId,
}: {
  requestId: number;
  connection?: PoolConnection;
}) {
  let localConnection = false;
  let newConnection: any;
  if (!connection) {
    localConnection = true;
    const newPool = await getDBConnection();
    newConnection = await newPool.getConnection();
    await newConnection.beginTransaction();
  }
  try {
    const today = getDateToday();
    if (!requestId || requestId === 0) {
      throw new Error("No Request ID Found!");
    }

    await updateRequests({
      connection: newConnection,
      keyFields: ["requestId"],
      updates: [
        {
          requestId: requestId,
          requestDeletedAt: today,
        },
      ],
    });

    await updateRequestItems({
      keyFields: ["requestId"],
      connection: newConnection,
      updates: [
        {
          requestId: requestId,
          reqItemStatus: "removed",
        },
      ],
    });
    if (localConnection) {
      await newConnection.commit();
    }
    return;
  } catch (e) {
    console.log({ e });
    if (localConnection) {
      await newConnection.rollback();
    }
    throw e;
  } finally {
    if (localConnection) {
      await newConnection.release();
    }
  }
}
