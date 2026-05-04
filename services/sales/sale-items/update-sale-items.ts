import { updateSaleItems } from "@/models/saleModel";
import { SaleItems } from "@/types/sales";
import { PoolConnection } from "mysql2/promise";

export const updateSaleItemsByFields = async ({
  connection,
  updates,
  keyFields = ["salesItemId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<SaleItems>[];
  keyFields?: (keyof SaleItems)[]; // which fields define the WHERE condition
}) => {
  return await updateSaleItems({ connection, updates, keyFields });
};
