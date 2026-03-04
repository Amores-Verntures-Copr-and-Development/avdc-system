import { updateSalePayments } from "@/models/saleModel";
import { SalePayments } from "@/types/sales";
import { PoolConnection } from "mysql2/promise";

export async function updateSalePaymentsByFields({
  connection,
  updates,
  keyFields = ["salesId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<SalePayments>[];
  keyFields?: (keyof SalePayments)[]; // which fields define the WHERE condition
}) {
  try {
    await updateSalePayments({ connection, keyFields, updates });
  } catch (e) {
    throw e;
  }
}
