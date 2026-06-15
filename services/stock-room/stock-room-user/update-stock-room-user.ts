import { updateStockRoomUsers } from "@/models/stockRoomModels";
import { StockRoomUsers } from "@/types/stockRoom";
import { PoolConnection } from "mysql2/promise";

export async function updateStockRoomUserByFields({
  data,
  keyFields = ["srUserId"],
  connection,
}: {
  data: Partial<StockRoomUsers>[];
  keyFields: (keyof StockRoomUsers)[];
  connection?: PoolConnection;
}) {
  return await updateStockRoomUsers({ data, keyFields, connection });
}
