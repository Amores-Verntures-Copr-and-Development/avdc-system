import {
  selectStockRoomUserNotInByID,
  selectStockRoomUsersByFields,
} from "@/models/stockRoomModels";
import { StockRoomUsers } from "@/types/stockRoom";
import { PoolConnection } from "mysql2/promise";

export async function selecteStockRoomByFields({
  fields,
  arrayFields,
  connection,
}: {
  fields?: Partial<StockRoomUsers>;
  arrayFields?: Partial<Record<keyof StockRoomUsers, any[]>>;
  connection?: PoolConnection;
}) {
  return await selectStockRoomUsersByFields({
    fields,
    arrayFields,
    connection,
  });
}

export async function selectStockRoomUserNotInStockRomID(stockRoomId: number) {
  return await selectStockRoomUserNotInByID({ stockRoomId });
}
