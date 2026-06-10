import {
  InterStoreRequests,
  ISRPurchasers,
  ISRRequestHandlers,
  ISRStores,
} from "@/types/isr";

export type CreateISRDto = Pick<
  InterStoreRequests,
  "isrCode" | "isrName" | "isrCreatedBy"
>;

export type CreateISRPurchaserDto = Pick<
  ISRPurchasers,
  "isrPurCreatedBy" | "userId" | "isrId"
>;

export interface DisplayISRPurchaserDTO extends ISRPurchasers {
  creator: string;
  purchaser: string;
}

export type CreateISRRequestHandlerDto = Pick<
  ISRRequestHandlers,
  "isrId" | "userId" | "isrReqHanCreatedBy"
>;

export interface DisplayISRRequestHandlerDTO extends ISRRequestHandlers {
  creator: string;
  requestHandler: string;
}

export type CreateISRStoreDto = Pick<
  ISRStores,
  "isrId" | "isrStoreCreatedBy" | "storeId"
>;

export interface DisplayISRStoresDTO extends ISRStores {
  storeName: string;
  creator: string;
}

export interface ISRConfiguration {
  userId: number;
  isrId: number;
  purchaser: ISRPurchasers[];
  requestHandler: ISRRequestHandlers[];
  store: ISRStores[];
}
