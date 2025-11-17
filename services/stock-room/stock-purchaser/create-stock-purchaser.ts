import { CreateStockPurchaser } from "@/dtos/stockRoom.dto";
import { insertStockPurchasers } from "@/models/stockRoomModels";
import { PoolConnection } from "mysql2/promise";

export async function createStockPurchaser({
  connection,
  data,
}: {
  data: CreateStockPurchaser[];
  connection?: PoolConnection;
}) {
  try {
    const res = await insertStockPurchasers({ data, connection });
    return res;
  } catch (e) {
    throw e;
  }
}
