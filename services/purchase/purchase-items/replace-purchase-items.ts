import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { PoolConnection } from "mysql2/promise";
import { deletePurchaseOrderItems } from "./delete-purchase-items";
import { createPurchaseOrderItem } from "./create-purchase-items";
import {
  CreatePurchaseOrderDto,
  CreatePurchaseOrderItemDto,
} from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { getSupplierItem } from "@/services/supplier/suppplier-items/get-supplier-item";
import { CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { createSupplierItems } from "@/services/supplier/suppplier-items/create-supplier-items";

export async function replacePOItems({
  from,
  to,
  replacedBy,
}: {
  from: PurchaseOrderItems;
  to: PurchaseOrderItems;

  replacedBy: number;
}) {
  if (!from) {
    throw new Error("No selected item!");
  }
  if (!to) {
    throw new Error("No replace item!");
  }
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  let isAdded: number = 0;
  await connection.beginTransaction();
  try {
    await deletePurchaseOrderItems({
      connection,
      data: [{ poItemId: from.poItemId }],
    });
    const newPoItem: CreatePurchaseOrderItemDto = {
      poItemOrderedQty: to.poItemOrderedQty,
      poId: to.poId,
      poItemReceivedQty: to.poItemReceivedQty,
      poItemStatus: to.poItemStatus,
      itemId: to.itemId,
      unitPrice: to.unitPrice,
      suppId: to.suppId,
    };

    const supplierItem = await getSupplierItem({
      connection,
      keyfields: { itemId: to.itemId, suppId: to.suppId! },
    });

    if (!supplierItem || supplierItem.length === 0) {
      const createSupplierItemData: CreateSupplierItemDto = {
        itemId: to.itemId,
        suppId: to.suppId!,
        suppItemPrice: 0,
        suppItemCreatedBy: replacedBy,
      };
      await createSupplierItems({ connection, data: [createSupplierItemData] });
      isAdded = 1;
    }
    await createPurchaseOrderItem({ connection, data: [newPoItem] });
    await connection.commit();
    return isAdded;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
