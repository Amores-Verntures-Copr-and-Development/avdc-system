import { selectPurchaserStats } from "@/models/dashboardModels";

export async function getDashboardStats() {
  try {
    const data = await selectPurchaserStats();
    return data;
  } catch (e) {
    throw e;
  }
}
