import {
  CreateSaleDto,
  CreateSaleItemDto,
  CreateSalePaymentDto,
} from "@/dtos/sales.dto";

import { getDBConnection } from "@/lib/db";

import {
  generateSalesInvoice,
  generateSalesNo,
} from "./generate-sales-invoice";
import { createSale } from "./create-sales";
import { createSaleItems } from "./sale-items/create-sale-items";
import { createSalePayments } from "./sale-payments/create-sale-payments";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";
import { InventoryItemInterface } from "@/types/inventory";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import {
  findInventoryByFields,
  findInventoryByStoreFields,
} from "../inventory/get-inventory";
import { createInventoryMovement } from "../inventory/inventory-movement/create-inventory-movement";
import { getSalesServices } from "./get-sales";

export async function processCreateSales(data: CreateSaleDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    //generate sales invoice by getting counting all sales records and plus 1 -
    const salesInvoice = await generateSalesInvoice({ connection });
    //generate salesNo by getting stores sales and plus 1 SALE-000001
    const salesNo = await generateSalesNo({
      connection,
      storeId: data.storeId,
    });
    const salesData: CreateSaleDto = {
      salesStatus: data.salesStatus,
      salesInvoice: salesInvoice,
      salesNo: salesNo,
      salesSubTotal: data.salesSubTotal,
      customerId: data.customerId,
      storeId: data.storeId,
      salesTotalAmount: data.salesTotalAmount,
      salesTotalPaid: data.salesTotalPaid,
      salesCreatedBy: data.salesCreatedBy,
    };
    //insert into sale table
    const salesId = await createSale({ connection, data: salesData });

    const saleItemData: CreateSaleItemDto[] =
      data.salesItems?.map((item) => ({
        inventoryItemId: item.inventoryItemId,
        salesItemPrice: item.salesItemPrice,
        salesItemQuantity: item.salesItemQuantity,
        salesItemSubtotal: item.salesItemSubtotal,
        salesId: salesId,
        saleItemQuantity: item.salesItemQuantity,
        prodVarId: item.prodVarId,
      })) ?? [];

    //insert into saleItems table
    await createSaleItems({ connection, data: saleItemData });
    const salesPaymentData: CreateSalePaymentDto[] =
      data.salesPayments?.map((payment) => ({
        salesId: salesId,
        paymentReference: payment.paymentReference,
        salesPaymentAmount: payment.salesPaymentAmount,
        payMetId: payment.payMetId,
        salesPaymentStatus: "completed",
      })) ?? [];

    //insert into salePayments
    await createSalePayments({ connection, data: salesPaymentData });
    const needDeductInventory = saleItemData.some(
      (item) => item.inventoryItemId
    );
    console.log({ saleItemData });
    console.log({ needDeductInventory });
    if (needDeductInventory) {
      const inventory = await findInventoryByStoreFields({
        keyFields: { storeId: data.storeId },
        connection,
      });

      const filterDeductItem = saleItemData.filter(
        (item) => item.inventoryItemId || item.inventoryItemId !== 0
      );
      const inventoryItem: Partial<InventoryItemInterface>[] =
        filterDeductItem.map((item) => ({
          inventoryItemId: item.inventoryItemId ?? 0,
          inventoryItemQuantity: item.salesItemQuantity,
        }));
      const inventoryMovement: CreateInventoryMovementDto[] =
        inventoryItem.map((item) => ({
          inventoryId: inventory[0].inventoryId,
          inventoryItemId: item.inventoryItemId ?? 0,
          itemMovementReference: "sales",
          itemMovementQuantity: item.inventoryItemQuantity ?? 0,
          itemMovementReferenceId: salesId,
          itemMovementType: "out",
          itemMovementRemarks: "",
        })) ?? [];

      await updateInventoryItem({
        connection,
        fieldModes: { inventoryItemQuantity: "decrement" },
        updates: inventoryItem,
        keyFields: ["inventoryItemId"],
      });
      await createInventoryMovement({ connection, data: inventoryMovement });
    }
    //check if there is items can be deducted
    //if exist deduct inventory
    //check if there is discounts
    //insert if there is discounts
    const sales = await getSalesServices.findSalesBySaleId({
      connection,
      salesId,
    });

    await connection.commit();
    return sales;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
