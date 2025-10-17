import { UpdatePurchaseOrdersDto } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { updatePurchase } from "./update-purchase-order";
import { updatePurchaseOrderItems } from "./purchase-items/update-purchase-items";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";

export async function processApprovedPO(data: UpdatePurchaseOrdersDto) {
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
        poStatus: "approved",
      },
    ];
    await updatePurchase({ connection, keyFields: ["poId"], updates: poData });
    const poItemsData: Partial<PurchaseOrderItems>[] =
      data.poItems?.map((item) => ({
        poItemId: item.poItemId,
        suppId: item.suppId,
        unitPrice: item.unitPrice,
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
