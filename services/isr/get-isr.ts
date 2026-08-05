import { selectISR } from "@/models/isrModels";
import { InterStoreRequests, ISRStores } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";
import { getISRPurchaser } from "./isr-purchaser/get-isr-purchaser";
import { getISRRequestHandler } from "./isr-request-handler/get-isr-request-handler";

export async function getISRByFields({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof InterStoreRequests, any>>;
}) {
  return await selectISR({ keyFields, connection });
}

export async function getISRUserInfoById(userId: number) {
  try {
    let isrIds: number[] = [];
    let storeIds: number[] = [];

    let requestHandler: [] = [];
    const isPurchaser = await getISRPurchaser({
      keyFields: { userId: userId, isrPurDeletedAt: null },
    });

    if (isPurchaser.data.length > 0) {
      isPurchaser.data.map((ip) => isrIds.push(ip.isrId));
    }
    const isRequestHandler = await getISRRequestHandler({
      keyFields: { userId: userId },
    });
    if (isRequestHandler.data.length > 0) {
    }
    return {
      isr: [],
      purchaser: [],
      requestHandler: [],
      stores: [],
    };
    //check in purchaser first
    //check in request handler
    //return info
  } catch (e) {}
}
