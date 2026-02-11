import { CreateOrderCompositeItemDro } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { insertOrderCompositeItem } from "@/models/orderCompositeItemModel";
import { PoolConnection } from "mysql2/promise";

export async function createOrderCompositeItems({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateOrderCompositeItemDro[];
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
    const ids = await insertOrderCompositeItem({
      connection: connection ? connection : newConnection,
      data,
    });

    const hasPricesData = data.filter((i) => Number(i.ordComPrice) !== 0);

    if (hasPricesData && hasPricesData.length > 0) {
      console.log({ hasPricesData });
    }
    if (localConnection) {
      await newConnection.commit();
    }
    return ids;
  } catch (e) {
    if (localConnection) {
      await newConnection.rollback();
    }
    throw e;
  } finally {
    // Optional: close connection if it was created here
    if (localConnection) {
      await newConnection.release();
    }
  }
}
