import { deleteStockRoomUsers } from "@/models/stockRoomModels";
import { StockRoomUsers } from "@/types/stockRoom";
import { PoolConnection } from "mysql2/promise";

export async function deleteStockRoomUserByFields({
  data,
  keyFields = ["srUserId"],
  connection,
}: {
  data: Partial<StockRoomUsers>[];
  keyFields: (keyof StockRoomUsers)[];
  connection?: PoolConnection;
}) {
  return await deleteStockRoomUsers({ data, keyFields, connection });
}
