import { updateSales } from "@/models/saleModel";
import { Sales } from "@/types/sales";
import { PoolConnection } from "mysql2/promise";

export async function updateSalesByFields({
  connection,
  updates,
  keyFields = ["salesId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<Sales>[];
  keyFields?: (keyof Sales)[]; // which fields define the WHERE condition
}) {
  try {
    await updateSales({ connection, keyFields, updates });
  } catch (e) {
    throw e;
  }
}
