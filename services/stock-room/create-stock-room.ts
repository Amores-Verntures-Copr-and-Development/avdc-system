import { CreateStockRoom } from "@/dtos/stockRoom.dto";
import { insertStockRoom } from "@/models/stockRoomModels";
import { PoolConnection } from "mysql2/promise";

export async function createStockRoom({
  data,
  connection,
}: {
  data: CreateStockRoom;
  connection: PoolConnection;
}) {
  try {
    const id = await insertStockRoom({ connection, data });
    return id;
  } catch (e) {
    throw e;
  }
}
