import {
  selectPendingRequestByUserId,
  selectPurchaserStats,
} from "@/models/dashboardModels";

export async function getDashboardStats(userId: number) {
  try {
    const data = await selectPurchaserStats(userId);
    return data;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function findPendingRequestByUserId(userId: number) {
  try {
    const data = await selectPendingRequestByUserId(userId);
    return data;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
