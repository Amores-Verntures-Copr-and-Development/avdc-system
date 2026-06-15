import {
  StockPurchasers,
  StockRoom,
  StockRoomUsers,
  StockStores,
} from "@/types/stockRoom";

export type CreateStockRoom = Pick<
  StockRoom,
  | "stockRoomName"
  | "stockRoomLocation"
  | "stockRoomDescription"
  | "stockRoomCreatedBy"
>;

export type CreateStockStore = Pick<
  StockStores,
  "stockStoresAddedBy" | "storeId" | "stockRoomId"
>;

export type CreateStockPurchaser = Pick<
  StockPurchasers,
  "userId" | "stockRoomId" | "stockPurchaserAddedBy"
>;

export type CreateStockRoomUserDTO = Pick<
  StockRoomUsers,
  "srUserAddedBy" | "stockRoomId" | "userId"
>;

export interface DisplayStockRoomUserDTO extends StockRoomUsers {
  srUserName: string;
  srAddedByName: string;
}
