import {
  selectPurchaserNotInStockPurchaser,
  selectStoreSuperVisorWithHasPassword,
  selectUserInfo,
  selectUserWithUserId,
} from "@/models/userModels";
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
