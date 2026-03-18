import { selectSalesRefunds } from "@/models/salesRefundModel";
import { SaleItems } from "@/types/sales";
import { SalesItemRefund, SalesRefund } from "@/types/sales-refund";
import { PoolConnection } from "mysql2/promise";

export async function getSalesRefundsByFields({
  keyFields = {},
  connection,
}: {
  keyFields: Partial<SalesRefund>;
  connection?: PoolConnection;
}) {
  try {
    return await selectSalesRefunds({ keyFields, connection });
  } catch (e) {
    throw e;
  }
}
