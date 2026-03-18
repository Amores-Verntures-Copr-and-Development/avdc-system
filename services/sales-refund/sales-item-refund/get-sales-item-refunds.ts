import { selectSalesItemRefunds } from "@/models/salesRefundModel";
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
