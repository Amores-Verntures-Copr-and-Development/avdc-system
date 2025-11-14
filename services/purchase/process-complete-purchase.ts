import { getDBConnection } from "@/lib/db";
import { updatePurchase } from "./update-purchase-order";
import { PurchaseOrders } from "@/types/purchaseOrders";

export async function processCompletePO(data: PurchaseOrders) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const poData: Partial<PurchaseOrders>[] = [
      {
        poId: data.poId,
        poStatus: "completed",
      },
    ];
    await updatePurchase({ connection, keyFields: ["poId"], updates: poData });
    // const poItemsData: Partial<PurchaseOrderItems>[] =
    //   data.poItems?.map((item) => ({
    //     poItemId: item.poItemId,
    //     suppId: item.suppId,
    //     unitPrice: item.unitPrice,
    //   })) || [];
    // await updatePurchaseOrderItems({
    //   connection,
    //   keyFields: ["poItemId"],
    //   updates: poItemsData,
    // });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
  } finally {
    connection.release();
  }
}
