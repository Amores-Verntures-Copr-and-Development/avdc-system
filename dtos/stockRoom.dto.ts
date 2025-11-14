import { StockPurchasers, StockRoom, StockStores } from "@/types/stockRoom";

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
