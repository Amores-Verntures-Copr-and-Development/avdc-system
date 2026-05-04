import {
  selectSalesItemRefunds,
  selectSalesItemWithTotalRefunds,
} from "@/models/salesRefundModel";
import { SaleItems } from "@/types/sales";
import { SalesItemRefund } from "@/types/sales-refund";
import { PoolConnection } from "mysql2/promise";

export async function getSalesItemRefundsByFields({
  keyFields = {},
  connection,
}: {
  keyFields: Partial<SalesItemRefund>;
  connection?: PoolConnection;
}) {
  try {
    return await selectSalesItemRefunds({
      keyFields: keyFields,
      connection: connection,
    });
  } catch (e) {
    throw e;
  }
}

export async function getSalesItemWithTotalRefundsByFields({
  keyFields = {},
  connection,
}: {
  keyFields: Partial<SaleItems>;
  connection?: PoolConnection;
}) {
  try {
    return await selectSalesItemWithTotalRefunds({
      keyFields: keyFields,
      connection: connection,
    });
  } catch (e) {
    throw e;
  }
}
