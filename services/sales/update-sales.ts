import { getDBConnection } from "@/lib/db";
import { updateSales } from "@/models/saleModel";
import { SalePayments, Sales } from "@/types/sales";
import { PoolConnection } from "mysql2/promise";
import { updateSalePaymentsByFields } from "./sale-payments/update-sale-payments";

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
      salesId: data.salesId,
      customerId: data.customerId,
      salesRemarks: data.salesRemarks,
      storeId: data.storeId,
    };
    if (!salesData) {
      throw new Error("No sales data!");
    }

    await updateSales({
      keyFields: ["salesId", "storeId"],
      updates: [salesData],
      connection: connection,
    });
    if (data.salePayments && data.salePayments.length > 0) {
      console.log("salesData.salePayments: ", data.salePayments);
      const updateSalePaymentData: Partial<SalePayments>[] =
        data.salePayments.map((sp) => ({
          salesPaymentId: sp.salesPaymentId,
          salesPaymentAmount: sp.salesPaymentAmount,
          paymentReference: sp.paymentReference,
          payMetId: Number(sp.payMetId),
        }));
      await updateSalePaymentsByFields({
        connection: connection,
        updates: updateSalePaymentData,
        keyFields: ["salesPaymentId"],
      });
    }
    if (data.saleItems && data.saleItems.length > 0) {
      //upad
    }
    //update the sales
    //update saleItems
    //update saleItemMethods
    //update discounts
    //update salesDiscounts
    await connection.commit();
  } catch (e) {
    console.error("Failed to update sales:", e);
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
