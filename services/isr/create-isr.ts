import { CreateISRDto } from "@/dtos/isr.dto";
import { getDBConnection } from "@/lib/db";
import { insertISR, selectISR, selectISRCount } from "@/models/isrModels";
import { PoolConnection } from "mysql2";

export async function createISR({
  data,
  connection,
}: {
  data: CreateISRDto;
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
    const hasNoCode = !data.isrCode || data.isrCode.trim() === "";

    if (hasNoCode) {
      const count = await selectISRCount({
        connection: connection ? connection : newConnection,
      });
      data.isrCode = `ISR-${String(count + 1).padStart(3, "0")}`;
    }

    const id = await insertISR({
      data,
      connection: connection ? connection : newConnection,
    });

    const isr = await selectISR({
      connection: connection ? connection : newConnection,
      keyFields: { isrId: id },
    });

    if (localConnection) {
      await newConnection.commit();
    }
    return isr[0];
  } catch (e) {
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
