import { selectPurchaserOrderByFields } from "@/models/purchaseOrderModel";

export async function findPurchaseOrderByUserId(userId: number) {
  try {
    const data = await selectPurchaserOrderByFields({
      keyfields: { poCreatedBy: userId },
    });
    return data;
  } catch (e) {
    throw e;
  }
}
