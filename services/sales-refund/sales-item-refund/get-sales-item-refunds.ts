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
  } catch (e) {}
}
