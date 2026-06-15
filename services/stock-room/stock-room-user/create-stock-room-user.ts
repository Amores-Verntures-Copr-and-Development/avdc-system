import { CreateStockRoomUserDTO } from "@/dtos/stockRoom.dto";
import {
  insertStockRoomUser,
  insertStockRoomUserBulk,
} from "@/models/stockRoomModels";
import { PoolConnection } from "mysql2/promise";

export async function createStockRoomUser({
  data,
  connection,
}: {
  data: CreateStockRoomUserDTO;
  connection?: PoolConnection;
}) {
  return await insertStockRoomUser({ payload: data, connection });
}

export async function createStockRoomUserBulk({
  data,
  connection,
}: {
  data: CreateStockRoomUserDTO[];
  connection?: PoolConnection;
}) {
  return await insertStockRoomUserBulk({ data: data, connection });
}
