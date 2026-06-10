export interface InterStoreRequests {
  isrId: number;
  isrCode: string;
  isrName: string;
  isrCreatedAt: string;
  isrUpdatedAt: string;
  isrDeletedAt: string | null;
  isrCreatedBy: number;
}

export interface ISRPurchasers {
  isrPurId: number;
  userId: number;
  isrId: number;
  isrPurCreatedBy: number;
  isrPurCreatedAt: string;
  isrPurUpdatedAt: string;
  isrPurDeletedAt: string | null;
}

export interface ISRRequestHandlers {
  isrReqHanId: number;
  userId: number;
  isrId: number;
  isrReqHanCreatedBy: number;
  isrReqHanCreatedAt: string;
  isrReqHanUpdatedAt: string;
  isrReqHanDeletedAt: string | null;
}

export interface ISRStores {
  isrStoreId: number;
  isrId: number;
  storeId: number;
  isrStoreCreatedBy: number;
  isrStoreCreatedAt: string;
  isrStorenUpdatedAt: string;
  isrStoreDeletedAt: string | null;
}
