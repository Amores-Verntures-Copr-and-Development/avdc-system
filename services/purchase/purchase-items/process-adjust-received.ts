import { getDBConnection } from "@/lib/db";
import {
  findPurchaserOrder,
  findPurchaserOrderItemByReqItemId,
} from "@/services/purchase/purchase-items/get-purchase-tems";
import { updatePurchaseOrderItems } from "@/services/purchase/purchase-items/update-purchase-items";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { getSalesItemServices } from "../../sales/sale-items/get-sale-items";
import { findInventoryByStockPurchaserFields } from "@/services/inventory/get-inventory";
import { updateInventoryItem } from "@/services/inventory/inventory-items/update-inventory-items";
import { InventoryItemInterface } from "@/types/inventory";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { findInventoryItemsByField } from "@/services/inventory/inventory-items/get-inventory-items";
import { createInventoryMovement } from "@/services/inventory/inventory-movement/create-inventory-movement";

export const processAdjustReceivedPOItem = async (
  poItem: Partial<PurchaseOrderItems> & { poCreatedBy: number },
) => {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    if (Number(poItem.poItemReceivedQty) === 0) {
      throw new Error("No received quantity to be adjust!");
    }

    //get the previouse PO first then do the math if subtract or sum the adjustment
    const inventory = await findInventoryByStockPurchaserFields({
      keyFields: { userId: poItem.poCreatedBy },
    });

    if (inventory.length === 0) {
      throw new Error("No inventory found!");
    }

    const prevPO = await findPurchaserOrder({
      connection: connection,
      keyfields: { poItemId: poItem.poItemId },
    });

    if (!prevPO || prevPO.length === 0) {
      throw new Error("No item in purchase order found!");
    }

    const prevPOData = prevPO[0];

    const adjustPrevInventoryItem: Partial<InventoryItemInterface> = {
      inventoryItemReferenceId: poItem.itemId,
      inventoryItemQuantity: prevPOData.poItemReceivedQty,
      inventoryId: inventory[0].inventoryId,
    };
    const adjustCurrentInventoryItem: Partial<InventoryItemInterface> = {
      inventoryItemReferenceId: poItem.itemId,
      inventoryItemQuantity: poItem.poItemReceivedQty,
      inventoryId: inventory[0].inventoryId,
    };
    const inventoryItem = await findInventoryItemsByField({
      keyFields: {
        inventoryId: inventory[0].inventoryId ?? 0,
        inventoryItemReferenceId: poItem.itemId,
      },
    });

    await updateInventoryItem({
      connection: connection,
      fieldModes: { inventoryItemQuantity: "decrement" },
      updates: [adjustPrevInventoryItem],
      keyFields: ["inventoryItemReferenceId", "inventoryId"],
    });

    const inventoryMovement: CreateInventoryMovementDto[] = [
      {
        inventoryId: inventory[0].inventoryId,
        inventoryItemId: inventoryItem.data[0]?.inventoryItemId ?? 0, // fallback if not found
        itemMovementType: "out",
        itemMovementReferenceId: poItem.poId ?? 0,
        itemMovementReference: "po",
        itemMovementQuantity: Number(
          adjustPrevInventoryItem.inventoryItemQuantity,
        ),
        itemMovementRemarks: `Received adjustment`,
      },
    ];

    await createInventoryMovement({ connection, data: inventoryMovement });

    await updateInventoryItem({
      connection: connection,
      fieldModes: { inventoryItemQuantity: "increment" },
      updates: [adjustCurrentInventoryItem],
      keyFields: ["inventoryItemReferenceId", "inventoryId"],
    });

    const inventoryCurrentMovement: CreateInventoryMovementDto[] = [
      {
        inventoryId: inventory[0].inventoryId,
        inventoryItemId: inventoryItem.data[0]?.inventoryItemId ?? 0, // fallback if not found
        itemMovementType: "in",
        itemMovementReferenceId: poItem.poId ?? 0,
        itemMovementReference: "po",
        itemMovementQuantity: Number(
          adjustCurrentInventoryItem.inventoryItemQuantity,
        ),
        itemMovementRemarks: `Received adjustment`,
      },
    ];
    await createInventoryMovement({
      connection,
      data: inventoryCurrentMovement,
    });

    await updatePurchaseOrderItems({
      connection: connection,
      updates: [
        {
          poItemId: poItem.poItemId,
          poItemReceivedQty: Number(poItem.poItemReceivedQty),
        },
      ],
      keyFields: ["poItemId"],
    });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};
