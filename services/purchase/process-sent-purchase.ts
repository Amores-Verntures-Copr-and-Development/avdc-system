import { UpdatePurchaseOrdersDto } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { PurchaseOrders, PurchaseOrderItems } from "@/types/purchaseOrders";
import { updatePurchaseOrderItems } from "./purchase-items/update-purchase-items";
import { updatePurchase } from "./update-purchase-order";

export async function processSendPO(data: UpdatePurchaseOrdersDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (data.poItems?.length === 0) {
      throw new Error("No items found");
    }
    const poData: Partial<PurchaseOrders>[] = [
      {
        poId: data.poId,
        poStatus: "sent",
      },
    ];
    await updatePurchase({ connection, keyFields: ["poId"], updates: poData });
    const poItemsData: Partial<PurchaseOrderItems>[] =
      data.poItems?.map((item) => ({
        poItemId: item.poItemId,
        poItemStatus: "sent",
      })) || [];
    await updatePurchaseOrderItems({
      connection,
      keyFields: ["poItemId"],
      updates: poItemsData,
    });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
  } finally {
    connection.release();
  }
}
