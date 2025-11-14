import { CreateStockRoom, CreateStockStore } from "@/dtos/stockRoom.dto";
import { insertStockStores } from "@/models/stockRoomModels";
import { PoolConnection } from "mysql2/promise";

export async function createStockStores({
  data,
  connection,
}: {
  data: CreateStockStore[];
  connection?: PoolConnection;
}) {
  try {
    const result = await insertStockStores({ data, connection });
    return result;
  } catch (e) {
    throw e;
  }
}
