import {
  selectPurchaserNotInStockPurchaser,
  selectUserInfo,
} from "@/models/userModels";
export async function getUserInfoByUserId({ userId }: { userId: number }) {
  try {
    const data = await selectUserInfo(userId);
    return data;
  } catch (e) {
    throw e;
  }
}
