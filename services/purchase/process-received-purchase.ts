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
import { handleUpdateSupplierItemPrice } from "../supplier/suppplier-items/update-supplier-items";
import { SupplierItem } from "@/types/supplier";
import { handleUpdateItemPrice } from "../items/update-items";
import { ItemInterface } from "@/types/items";
import { findSupplierById } from "../supplier/get-supplier";
import { RequestItems } from "@/types/request";
import { findRequestItemsByPoItemIdWithConverions } from "../request/request-items/get-request-items";
import { updateRequestItems } from "../request/request-items/update-request-items";

export async function processReceivedPO(data: UpdatePurchaseOrdersDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (data.poItems?.length === 0 || !data.poItems) {
      const poData: Partial<PurchaseOrders>[] = [
        {
          poId: data.poId,
          poStatus: "received",
        },
      ];

      await updatePurchase({
        connection,
        keyFields: ["poId"],
        updates: poData,
      });
    } else {
      const notOrderedItems = data.poItems?.filter(
        (item) => item.poItemStatus === "not_ordered",
      );
      if (notOrderedItems && notOrderedItems.length > 0) {
        //updatePoItemStatus to notOrdered
        const updateNotOrdered: Partial<PurchaseOrderItems>[] =
          notOrderedItems.map((item) => ({
            poItemId: item.poItemId,
            poItemStatus: "not_ordered",
          }));
        await updatePurchaseOrderItems({
          connection,
          keyFields: ["poItemId"],
          updates: updateNotOrdered,
        });
      }
      const validReceivedData = data.poItems?.filter(
        (item) =>
          item.poItemStatus !== "not_ordered" && item.poItemStatus === "sent",
      );

      if (validReceivedData && validReceivedData.length > 0) {
        const poItemsData: Partial<PurchaseOrderItems>[] =
          validReceivedData.map((item) => ({
            poItemId: item.poItemId,
            poItemReceivedQty: Number(item.poItemReceivedQty),
            poItemStatus: "received",
          })) || [];
        await updatePurchaseOrderItems({
          connection,
          keyFields: ["poItemId"],
          updates: poItemsData,
        });
        //add to warehouse inventory
        const warehouseInv = await findInventoryByStockPurchaserFields({
          keyFields: { userId: data.updatedBy },
        });
        const addItemsData: Partial<InventoryItemInterface>[] =
          validReceivedData.flatMap((item) => ({
            inventoryItemReferenceId: item.itemId,
            inventoryItemQuantity: Number(item.poItemReceivedQty),
            inventoryId: warehouseInv[0].inventoryId,
          })) || [];
        await updateInventoryItem({
          connection,
          fieldModes: { inventoryItemQuantity: "increment" },
          updates: addItemsData,
          keyFields: ["inventoryItemReferenceId", "inventoryId"],
        });
        const inventoryMovement: CreateInventoryMovementDto[] =
          await Promise.all(
            (validReceivedData ?? []).map(async (item) => {
              // Assuming findInventoryItemsByField returns a single inventory item or array
              const inventoryItem = await findInventoryItemsByField({
                keyFields: {
                  inventoryId: warehouseInv[0].inventoryId ?? 0,
                  inventoryItemReferenceId: item.itemId,
                },
              });
              const findSupplier = await findSupplierById(item.suppId ?? 0);
              return {
                inventoryId: warehouseInv[0].inventoryId,
                inventoryItemId: inventoryItem.data[0]?.inventoryItemId ?? 0, // fallback if not found
                itemMovementType: "in",
                itemMovementReferenceId: data.poId ?? 0,
                itemMovementReference: "po",
                itemMovementQuantity: Number(item.poItemReceivedQty),
                itemMovementRemarks: `Received from supplier ${findSupplier[0]?.suppName}`,
              };
            }),
          );

        await createInventoryMovement({ connection, data: inventoryMovement });
        const poItems = await findPurchaserOrder({
          connection,
          keyfields: { poId: data.poId, suppId: 0 },
        });
        const filterDelivered = poItems.filter(
          (item) =>
            item.poItemStatus !== "not_ordered" &&
            item.poItemStatus !== "removed",
        );
        const isAllDeliverd = filterDelivered.every(
          (item) => item.poItemStatus === "received",
        );

        if (isAllDeliverd) {
          const poData: Partial<PurchaseOrders>[] = [
            {
              poId: data.poId,
              poStatus: "received",
            },
          ];
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
                item.supplierPrice !== undefined &&
                Number(item.supplierPrice) !== 0,
            )
            .map((item) => ({
              suppId: item.suppId ?? undefined, // convert null to undefined
              suppItemPrice: item.supplierPrice,
              itemId: item.itemId,
              suppItemCreatedBy: data.updatedBy,
            })) ?? [];
        const updatePoItemUnitPrice: Partial<PurchaseOrderItems>[] =
          data.poItems
            ?.filter(
              (item) =>
                item.supplierPrice !== undefined &&
                Number(item.supplierPrice) !== 0,
            )
            .map((item) => ({
              poItemId: item.poItemId,
              unitPrice: item.supplierPrice,
            })) ?? [];
        if (updatePoItemUnitPrice && updatePoItemUnitPrice.length > 0) {
          let updateRequestItemsPrice: Partial<RequestItems>[] = [];
          await updatePurchaseOrderItems({
            connection,
            keyFields: ["poItemId"],
            updates: updatePoItemUnitPrice,
          });

          for (const i of updatePoItemUnitPrice) {
            const reqItems = await findRequestItemsByPoItemIdWithConverions({
              connection,
              poItemId: i.poItemId!,
            });

            if (reqItems && reqItems.length > 0) {
              const reqItemPrices = reqItems.map((req) => {
                if (req.itemConId) {
                  if (req.fromItemId === req.inventoryItemReferenceId) {
                    const fromItemPrice =
                      Number(req.fromQuantity) * Number(i.unitPrice);

                    return {
                      reqItemId: req.reqItemId,
                      unitPrice: Number(fromItemPrice),
                    };
                  }
                  if (req.toItemId === req.inventoryItemReferenceId) {
                    const fromItemPrice =
                      Number(i.unitPrice) / Number(req.toQuantity);

                    return {
                      reqItemId: req.reqItemId,
                      unitPrice: Number(fromItemPrice),
                    };
                  }
                  return {
                    reqItemId: req.reqItemId,
                    unitPrice: Number(i.unitPrice),
                  };
                }
                return {
                  reqItemId: req.reqItemId,
                  unitPrice: Number(i.unitPrice),
                };
              });
              updateRequestItemsPrice.push(...reqItemPrices);
            }
          }

          if (updateRequestItemsPrice && updateRequestItemsPrice.length > 0) {
            await updateRequestItems({
              connection,
              keyFields: ["reqItemId"],
              updates: updateRequestItemsPrice,
            });
          }
        }
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
      }
    }
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
