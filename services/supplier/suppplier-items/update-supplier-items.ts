import { updateSupplierItemsByFields } from "@/models/supplierModels";
import { SupplierItem } from "@/types/supplier";
import { PoolConnection } from "mysql2/promise";
import { createSupplierItemPrices } from "./supplier-item-price/create-supplier-item-price";
import {
  CreateSupplierItemDto,
  CreateSupplierItemPriceDto,
} from "@/dtos/supplier.dto";
import { getSupplierItem } from "./get-supplier-item";
import { createSupplierItems } from "./create-supplier-items";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { getDBConnection } from "@/lib/db";
import { formatPeso } from "@/utils/formatPeso";
import { ItemInterface, ItemPrice } from "@/types/items";
import { handleUpdateItemPrice } from "@/services/items/update-items";
import { updatePurchaseOrderItems } from "@/services/purchase/purchase-items/update-purchase-items";
import { findRequestItemsByPoItemIdWithConverions } from "@/services/request/request-items/get-request-items";
import { RequestItems } from "@/types/request";
import { updateRequestItems } from "@/services/request/request-items/update-request-items";

export async function handleDeleteSupplierItems(data: Partial<SupplierItem>[]) {
  const deletedData: Partial<SupplierItem>[] = data.map((item) => ({
    suppItemId: item.suppItemId,
    suppItemStatus: "deleted",
  }));
  try {
    const result = await updateSupplierItemsByFields({
      keyFields: ["suppItemId"],
      data: deletedData,
    });
    return result;
  } catch (e) {
    throw e;
  }
}

export async function updateSupplierItems({
  connection,
  updates,
  keyFields = ["suppItemId"],
}: //   fieldModes = {}, // default primary key
{
  connection?: PoolConnection;
  updates: Partial<SupplierItem>[];
  keyFields?: (keyof SupplierItem)[];
  //   fieldModes?: Partial<Record<keyof RequestItems, any>>;
}) {
  try {
    const result = await updateSupplierItemsByFields({
      connection,
      keyFields: keyFields,
      data: updates,
    });
    return result;
  } catch (e) {
    throw e;
  }
}

export async function handleUpdateSupplierItemPrice({
  connection,
  updates,
  keyFields = ["suppItemId"],
}: {
  connection?: PoolConnection;
  updates: Partial<SupplierItem>[];
  keyFields?: (keyof SupplierItem)[];
}) {
  let localConnection = false;
  let newConnection: any;
  if (!connection) {
    localConnection = true;
    const newPool = await getDBConnection();
    newConnection = await newPool.getConnection();
    await newConnection.beginTransaction();
  }
  try {
    const result = await updateSupplierItemsByFields({
      connection: connection ? connection : newConnection,
      keyFields: keyFields,
      data: updates,
    });
    const hasSuppItemId = updates.every((item) => item.suppItemId);

    if (hasSuppItemId) {
      const itemPrices: CreateSupplierItemPriceDto[] = updates
        .filter(
          (item) =>
            item.suppItemId !== undefined &&
            item.suppItemPrice !== undefined &&
            item.suppItemCreatedBy !== undefined,
        )
        .map((item) => ({
          suppItemId: item.suppItemId!,
          sipAmount: item.suppItemPrice!,
          sipCreatedBy: item.suppItemCreatedBy!,
        }));

      await createSupplierItemPrices({
        connection: connection ? connection : newConnection,
        data: itemPrices,
      });
      if (localConnection) {
        await newConnection.commit();
      }
    } else {
      const itemPricesPromises = updates.map(async (item) => {
        console.log({ item });
        let suppItem = await getSupplierItem({
          connection: connection ? connection : newConnection,
          keyfields: { suppId: item.suppId, itemId: item.itemId },
        });

        if (!suppItem || suppItem.length === 0) {
          const createSuppItem: CreateSupplierItemDto = {
            itemId: item.itemId!,
            suppItemPrice: item.suppItemPrice ?? 0,
            suppItemCreatedBy: item.suppItemCreatedBy!,
            suppId: item.suppId!,
          };
          await createSupplierItems({
            connection: connection ? connection : newConnection,
            data: [createSuppItem],
          });
          suppItem = await getSupplierItem({
            connection: connection ? connection : newConnection,
            keyfields: { suppId: item.suppId, itemId: item.itemId },
          });
        }

        return {
          suppItemId: suppItem[0].suppItemId,
          sipAmount: item.suppItemPrice!,
          sipCreatedBy: item.suppItemCreatedBy!,
        };
      });

      // Wait for all promises to resolve
      const itemPrices: CreateSupplierItemPriceDto[] =
        await Promise.all(itemPricesPromises);

      // Now use itemPrices
      await createSupplierItemPrices({
        connection: connection ? connection : newConnection,
        data: itemPrices,
      });
      if (localConnection) {
        await newConnection.commit();
      }
    }

    return result;
  } catch (e) {
    console.log({ e });
    if (localConnection) {
      await newConnection.rollback();
    }
    throw e;
  } finally {
    if (localConnection) {
      await newConnection.release();
    }
  }
}

export async function updateSupplierPriceFromPO({
  supplierItemPrice,
  poItem,
  isUpdateItem,
}: {
  supplierItemPrice: CreateSupplierItemPriceDto;
  poItem: PurchaseOrderItems;
  isUpdateItem: boolean;
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const supplierItem = await getSupplierItem({
      keyfields: { itemId: poItem.itemId, suppId: poItem.suppId! },
      connection,
    });

    await updatePurchaseOrderItems({
      connection: connection,
      updates: [
        {
          poItemId: poItem.poItemId,
          unitPrice: Number(supplierItemPrice.sipAmount),
        },
      ],
    });
    if (!supplierItem) {
      await connection.rollback();
      throw new Error("No supplier found for this item!");
    }
    const suppItemPricePartial: Partial<SupplierItem> = {
      suppItemId: supplierItem[0].suppItemId,
      suppItemPrice: Number(supplierItemPrice.sipAmount),
      suppItemCreatedBy: supplierItemPrice.sipCreatedBy,
    };
    console.log({ suppItemPricePartial });
    await handleUpdateSupplierItemPrice({
      updates: [suppItemPricePartial],
      keyFields: ["suppItemId"],
      connection,
    });

    if (isUpdateItem) {
      const itemPrice: Partial<ItemInterface> = {
        itemId: poItem.itemId,
        itemPrice: supplierItemPrice.sipAmount,
        itemAddedBy: supplierItemPrice.sipCreatedBy,
      };
      await handleUpdateItemPrice({ connection, updates: [itemPrice] });
    }

    const reqItems = await findRequestItemsByPoItemIdWithConverions({
      connection,
      poItemId: poItem.poItemId,
    });
    let updateRequestItemUnitPrice: Partial<RequestItems>[] = [];
    console.log({ reqItems });
    for (const req of reqItems) {
      let computedPrice = supplierItemPrice.sipAmount;

      if (req.itemConId) {
        const isFrom = req.fromItemId === req.inventoryItemReferenceId;
        const isTo = req.toItemId === req.inventoryItemReferenceId;

        if (isFrom) {
          computedPrice = supplierItemPrice.sipAmount / req.conversionRate;
        } else if (isTo) {
          computedPrice = supplierItemPrice.sipAmount * req.conversionRate;
        }
      } else {
        computedPrice = supplierItemPrice.sipAmount;
      }

      updateRequestItemUnitPrice.push({
        reqItemId: req.reqItemId,
        unitPrice: Number(computedPrice),
      });
    }
    if (updateRequestItemUnitPrice && updateRequestItemUnitPrice.length) {
      console.log({ updateRequestItemUnitPrice });
      await updateRequestItems({
        connection: connection,
        updates: updateRequestItemUnitPrice,
        keyFields: ["reqItemId"],
      });
    }
    //update the unit price of po and request po
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
