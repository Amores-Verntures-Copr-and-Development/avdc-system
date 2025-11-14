export interface StockRoom {
  stockRoomId: number;
  stockRoomName: string;
  stockRoomDescription: string;
  stockRoomLocation: string;
  stockRoomCreatedAt: string;
  stockRoomUpdatedAt: string;
  stockRoomDeletedAt: string;
  stockRoomCreatedBy: number;
}

export interface StockPurchasers {
  stockPurchaserId: number;
  stockPurchaserCreatedAt: string;
  stockPurchaserUpdatedAt: string;
  stockPurchaserDeletedAt: string;
  stockRoomId: number;
  userId: number;
}

export interface StockStores {
  stockStoresId: number;
  stockStoresCreatedAt: string;
  stockStoresUpdatedAt: string;
  stockStoresDeletedAt: string;
  stockStoresAddedBy: number;
  stockRoomId: number;
  storeId: number | null;
}
