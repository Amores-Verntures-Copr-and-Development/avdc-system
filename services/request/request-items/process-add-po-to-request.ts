import { POAddToRequestItemForm } from "@/app/purchase-orders/components/_components/AddItemToRequestFromPOModal";
import { getDBConnection } from "@/lib/db";
import { createRequestItem } from "./create-request-items";
import { CreateRequestItemDto } from "@/dtos/request.dto";
import { findStoreInventoryByRequestId } from "@/services/inventory/get-inventory";
import { findInventoryItemsByField } from "@/services/inventory/inventory-items/get-inventory-items";
import { updateRequestItems } from "./update-request-items";
import { RequestItems } from "@/types/request";

export const processAddItemFromPOtoRequest = async (
  data: POAddToRequestItemForm,
) => {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  if (data.poItems.length === 0) {
    return {
      success: false,
      message: "No items to add to request",
    };
  }
  try {
    await connection.beginTransaction();

    //find inventory by requestId
    const inventory = await findStoreInventoryByRequestId({
      id: data.requestId,
      connection,
    });
    if (!inventory || inventory.length === 0) {
      throw new Error("No inventory found for the request");
    }
    let updateItems: Partial<RequestItems>[] = [];

    const requestItems: CreateRequestItemDto[] = await Promise.all(
      data.poItems.map(async (poItem) => {
        const inventoryItem = await findInventoryItemsByField({
          keyFields: {
            inventoryItemReferenceId: poItem.itemId,
            inventoryId: inventory[0].inventoryId,
          },
          connection,
        });

        if (inventoryItem.data.length === 0) {
          throw new Error(
            `No inventory item found for itemId ${poItem.itemId}`,
          );
        }
        updateItems.push({
          invItem: inventoryItem.data[0].inventoryItemId,
          requestId: data.requestId,
          reqItemStatus: "pending",
        });
        return {
          requestId: data.requestId,
          itemId: poItem.itemId,
          invItem: inventoryItem.data[0].inventoryItemId,
          reqItemQuantity: 0,
          addedBy: data.addedBy,
          reqItemStatus: "pending",
        };
      }),
    );
    await createRequestItem({ data: requestItems, connection });
    await updateRequestItems({
      connection,
      keyFields: ["invItem", "requestId"],
      updates: updateItems,
    });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};
