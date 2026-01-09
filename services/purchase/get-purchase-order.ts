import {
  selectPObyPoOrderRequestFields,
  selectProcurementHistoryByPO,
  selectPurchaserOrderByFields,
} from "@/models/purchaseOrderModel";
import { PurchaseOrderRequest } from "@/types/purchaseOrders";
import { PoolConnection } from "mysql2/promise";

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

export async function findPurchaserOrderByPORequestFields({
  connection,
  keyfields = {},
}: {
  connection?: PoolConnection;
  keyfields: Partial<PurchaseOrderRequest>;
}) {
  try {
    const data = await selectPObyPoOrderRequestFields({
      connection,
      keyfields,
    });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findProcurementHistory() {
  try {
    const data = await selectProcurementHistoryByPO();
    return data;
  } catch (e) {
    throw e;
  }
}
