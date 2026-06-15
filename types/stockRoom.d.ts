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
  stockPurchaserAddedBy: number;
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
  storeId?: number | null;
}

export interface StockRoomUsers {
  srUserId: number;
  userId: number;
  stockRoomId: number;
  srUserAddedBy: number;
  srUserCreatedAt: string;
  srUserUpdatedAt: string;
  srUserDeletedAt: string;
}
