import {
  CreateSaleDto,
  CreateSaleItemDto,
  CreateSalePaymentDto,
} from "@/dtos/sales.dto";
import { createSale } from "./create-sales";
import { getDBConnection } from "@/lib/db";
import { selectCountSales } from "@/models/saleModel";
import { selectStores } from "@/models/storeModels";
import { createSaleItems } from "./sale-items/create-sale-items";
import { createSalePayments } from "./sale-payments/create-sale-payments";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";
import { findIventoryByFields } from "../inventory/get-inventory";
import { InventoryItemInterface } from "@/types/inventory";
import { createInventoryMovement } from "../inventory/inventory-movement/create-inventory-movement";

export async function processCreateSales(data: CreateSaleDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    //Generate ReceiptNo
    const SaleRows = await selectCountSales({
      connection,
      storeId: data.storeId,
    });
    const receiptNo = `INV-${new Date().getFullYear()}-${(SaleRows.total + 1)
      .toString()
      .padStart(3, "0")}`;
    const newSale: CreateSaleDto = {
      ...data,
      receiptNo: receiptNo,
    };
    //Create Sales
    const newSaleId = await createSale({ connection, data: newSale });
    //Create Sale Item
    const newSaleItem: CreateSaleItemDto[] =
      data.salesItems?.map((items) => ({
        ...items,
        salesId: newSaleId,
      })) ?? [];
    await createSaleItems({ connection, data: newSaleItem });
    //Create Sale Payments
    const newSalePayments: CreateSalePaymentDto[] =
      data.salePayments?.map((payment) => ({
        ...payment,
        salesId: newSaleId,
      })) ?? [];
    await createSalePayments({ connection, data: newSalePayments });
    //Deduct inventory Items
    //Insert item Movement
    const itemInventoryId = await findIventoryByFields({
      keyFields: {
        storeId: data.storeId,
      },
    });
    const minusInventoryQty: Partial<InventoryItemInterface>[] =
      data.salesItems?.map((prod) => ({
        inventoryItemId: prod.inventoryItemId,
        inventoryItemQuantity: prod.saleItemQuantity,
      })) || [];
    await updateInventoryItem({
      connection,
      fieldModes: { inventoryItemQuantity: "decrement" },
      updates: minusInventoryQty,
      keyFields: ["inventoryItemId"],
    });
    if (newSaleItem) {
      const storeInventoryMovement: CreateInventoryMovementDto[] =
        newSaleItem.map((item) => ({
          inventoryId: itemInventoryId[0].inventoryId,
          inventoryItemId: item.inventoryItemId,
          itemMovementType: "out",
          itemMovementReferenceId: newSaleId ?? 0,
          itemMovementReference: "sales",
          itemMovementQuantity: item.saleItemQuantity,
          itemMovementRemarks: "Point of sale transaction",
        }));

      await createInventoryMovement({
        connection,
        data: storeInventoryMovement,
      });
    }
    await connection.commit();
    return {
      saleId: newSaleId,
      receiptNo: receiptNo,
      items: newSaleItem,
      payments: newSalePayments,
    };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
