import { UpdatePurchaseOrdersDto } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";
import { updatePurchase } from "./update-purchase-order";
import { updatePurchaseOrderItems } from "./purchase-items/update-purchase-items";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";
import { InventoryItemInterface } from "@/types/inventory";
import { findIventoryByFields } from "../inventory/get-inventory";

export async function processReceivedPO(data: UpdatePurchaseOrdersDto) {
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
        poStatus: "received",
      },
    ];
    await updatePurchase({ connection, keyFields: ["poId"], updates: poData });
    const poItemsData: Partial<PurchaseOrderItems>[] =
      data.poItems?.map((item) => ({
        poItemId: item.poItemId,
        poItemStatus: "received",
      })) || [];
    await updatePurchaseOrderItems({
      connection,
      keyFields: ["poItemId"],
      updates: poItemsData,
    });
    //add to warehouse inventory
    const warehouseInv = await findIventoryByFields({
      keyFields: { storeId: null },
    });
    const addItemsData: Partial<InventoryItemInterface>[] =
      data.poItems?.flatMap((item) => ({
        inventoryItemReferenceId: item.itemId,
        inventoryItemQuantity: item.poItemReceivedQty,
        inventoryId: warehouseInv[0].inventoryId,
      })) || [];
    updateInventoryItem({
      connection,
      fieldModes: { inventoryItemQuantity: "increment" },
      updates: addItemsData,
      keyFields: ["inventoryItemReferenceId", "inventoryId"],
    });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
  } finally {
    connection.release();
  }
}
