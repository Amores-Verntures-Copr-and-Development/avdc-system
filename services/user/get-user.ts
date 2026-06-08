import {
  selectPurchaserNotInStockPurchaser,
  selectStoreSuperVisorWithHasPassword,
  selectUserInfo,
  selectUserNotInISRPurchaser,
  selectUserWithUserId,
} from "@/models/userModels";
import { InterStoreRequests } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";
export async function getUserInfoByUserId({ userId }: { userId: number }) {
  try {
    const data = await selectUserInfo(userId);
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getStoreSuperVisorForRefund({
  storeId,
  connection,
}: {
  storeId: number;
  connection: PoolConnection;
}) {
  try {
    const data = await selectStoreSuperVisorWithHasPassword({
      storeId,
      connection,
    });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getOwnInfoForRefund({
  userId,
  connection,
}: {
  userId: number;
  connection: PoolConnection;
}) {
  try {
    const data = await selectUserWithUserId({
      userId,
      connection,
    });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getUserNotInISRPurchser({
  keyFields = {},
  connection,
  limit,
  search,
}: {
  keyFields?: Partial<Record<keyof InterStoreRequests, any>>;
  connection?: PoolConnection;
  limit: number;
  search?: string;
}) {
  return await selectUserNotInISRPurchaser({
    keyFields,
    connection,
    limit,
    search,
  });
}
