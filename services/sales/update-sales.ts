import { getDBConnection } from "@/lib/db";
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

export async function updateSalesBySalesId({
  data,
  salesId,
}: {
  data: Partial<Sales>;
  salesId: number;
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const salesData: Partial<Sales> = {
      ...data,
    };
    if (!salesData) {
      throw new Error("No sales data!");
    }
    await updateSales({
      keyFields: ["salesId", "storeId"],
      updates: [salesData],
      connection: connection,
    });
    //update the sales
    //update saleItems
    //update saleItemMethods
    //update discounts
    //update salesDiscounts
    await connection.commit();
  } catch (e) {
    await connection.rollback();
  } finally {
    connection.release();
  }
}
