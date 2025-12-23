import { UpdatePurchaseOrdersDto } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";
import { updatePurchase } from "./update-purchase-order";
import { updatePurchaseOrderItems } from "./purchase-items/update-purchase-items";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";
import { InventoryItemInterface } from "@/types/inventory";
import { findInventoryByStockPurchaserFields } from "../inventory/get-inventory";
import { createInventoryMovement } from "../inventory/inventory-movement/create-inventory-movement";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { findInventoryItemsByField } from "../inventory/inventory-items/get-inventory-items";
import { findPurchaserOrder } from "./purchase-items/get-purchase-tems";
import {
  handleUpdateSupplierItemPrice,
  updateSupplierItems,
} from "../supplier/suppplier-items/update-supplier-items";
import { SupplierItem } from "@/types/supplier";
import { handleUpdateItemPrice } from "../items/update-items";
import { ItemInterface } from "@/types/items";

export async function processReceivedPO(data: UpdatePurchaseOrdersDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (data.poItems?.length === 0) {
      throw new Error("No items found");
    }

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
    console.log(`data.poCreatedBy: `, data.poCreatedBy);
    const warehouseInv = await findInventoryByStockPurchaserFields({
      keyFields: { userId: data.updatedBy },
    });
    const addItemsData: Partial<InventoryItemInterface>[] =
      data.poItems?.flatMap((item) => ({
        inventoryItemReferenceId: item.itemId,
        inventoryItemQuantity: item.poItemReceivedQty,
        inventoryId: warehouseInv[0].inventoryId,
      })) || [];
    await updateInventoryItem({
      connection,
      fieldModes: { inventoryItemQuantity: "increment" },
      updates: addItemsData,
      keyFields: ["inventoryItemReferenceId", "inventoryId"],
    });
    const inventoryMovement: CreateInventoryMovementDto[] = await Promise.all(
      (data.poItems ?? []).map(async (item) => {
        // Assuming findInventoryItemsByField returns a single inventory item or array
        const inventoryItem = await findInventoryItemsByField({
          keyFields: {
            inventoryId: warehouseInv[0].inventoryId ?? 0,
            inventoryItemReferenceId: item.itemId,
          },
        });

        return {
          inventoryId: warehouseInv[0].inventoryId,
          inventoryItemId: inventoryItem.data[0]?.inventoryItemId ?? 0, // fallback if not found
          itemMovementType: "in",
          itemMovementReferenceId: data.poId ?? 0,
          itemMovementReference: "po",
          itemMovementQuantity: Number(item.poItemReceivedQty),
          itemMovementRemarks: "Received from supplier",
        };
      })
    );
    console.log("[createInventoryMovement]");
    await createInventoryMovement({ connection, data: inventoryMovement });
    const poItems = await findPurchaserOrder({
      connection,
      keyfields: { poId: data.poId, suppId: 0 },
    });
    const isAllDeliverd = poItems.every(
      (item) => item.poItemStatus === "received"
    );

    if (isAllDeliverd) {
      const poData: Partial<PurchaseOrders>[] = [
        {
          poId: data.poId,
          poStatus: "received",
        },
      ];
      console.log("UpdatePurchaseOrdersDto: ", data);
      await updatePurchase({
        connection,
        keyFields: ["poId"],
        updates: poData,
      });
    }
    const updateSupplierItemPrice: Partial<SupplierItem>[] =
      data.poItems
        ?.filter(
          (item) =>
            item.supplierPrice !== undefined && Number(item.supplierPrice) !== 0
        )
        .map((item) => ({
          suppId: item.suppId ?? undefined, // convert null to undefined
          suppItemPrice: item.supplierPrice,
          itemId: item.itemId,
          suppItemCreatedBy: data.updatedBy,
        })) ?? [];

    if (updateSupplierItemPrice && updateSupplierItemPrice.length > 0) {
      await handleUpdateSupplierItemPrice({
        connection,
        updates: updateSupplierItemPrice,
        keyFields: ["suppId", "itemId"],
      });
      const itemPrice: Partial<ItemInterface>[] =
        updateSupplierItemPrice?.map((item) => ({
          itemId: item.itemId,
          itemPrice: item.suppItemPrice,
          itemAddedBy: data.updatedBy,
        })) ?? [];
      await handleUpdateItemPrice({ connection, updates: itemPrice });
    }
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
