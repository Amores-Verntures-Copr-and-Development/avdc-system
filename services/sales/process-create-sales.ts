import {
  CreateSaleDto,
  CreateSaleItemDto,
  CreateSalePaymentDto,
  CreateSalesDiscount,
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
import { createSalesDiscounts } from "./sale-discounts/create-sales-discounts";
import { updateSalesByFields } from "./update-sales";
import { SalesPaymentStatus } from "../../types/sales";
import { CreateTransactionDto } from "@/dtos/transaction.dto";
import { createTransactions } from "../transaction/create-transaction";
import { sendEmailSalesBasePaymentMethods } from "./send-email-sales";

export async function processCreateSales(data: CreateSaleDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const salesNo = await generateSalesNo({
      connection,
      storeId: data.storeId,
    });
    const salesData: CreateSaleDto = {
      salesStatus: data.salesStatus,
      salesInvoice: "",
      salesNo: salesNo,
      salesSubTotal: data.salesSubTotal,
      customerId: data.customerId,
      storeId: data.storeId,
      salesTotalAmount: data.salesTotalAmount,
      salesTotalPaid: data.salesTotalPaid,
      salesCreatedBy: data.salesCreatedBy,
      salesRemarks: data.salesRemarks,
    };

    const salesId = await createSale({ connection, data: salesData });
    const salesInserted = await getSalesServices.findSalesBySaleId({
      connection: connection,
      salesId,
    });
    console.log({ salesInserted });
    const salesInvoice = await generateSalesInvoice({
      connection,
      id: salesId,
    });
    await updateSalesByFields({
      connection,
      updates: [
        {
          salesId: salesId,
          salesInvoice: salesInvoice,
        },
      ],
      keyFields: ["salesId"],
    });
    const saleItemData: CreateSaleItemDto[] =
      data.salesItems?.map((item) => ({
        salesItemPrice: item.salesItemPrice,
        salesItemQuantity: item.salesItemQuantity,
        salesItemSubtotal: item.salesItemSubtotal,
        salesItemTotal: item.salesItemTotal,
        salesId: salesId,
        saleItemQuantity: item.salesItemQuantity,
        prodVarId: item.prodVarId,
        inventoryItemId: item.inventoryItemId,
        components: item.components,
        salesItemDiscounts: item.salesItemDiscounts,
      })) ?? [];

    //insert into saleItems table
    if (saleItemData.length > 0) {
      await createSaleItems({ connection, data: saleItemData });
    }
    const salesPaymentData: CreateSalePaymentDto[] =
      data.salesPayments?.map((payment) => ({
        salesId: salesId,
        paymentReference: payment.paymentReference,
        salesPaymentAmount: payment.salesPaymentAmount,
        payMetId: payment.payMetId,
        salesPaymentStatus: SalesPaymentStatus.COMPLETED,
      })) ?? [];

    //insert into salePayments
    if (salesPaymentData.length > 0) {
      await createSalePayments({ connection, data: salesPaymentData });
    }

    const needDeductInventoryProdVar = saleItemData.filter(
      (i) => i.inventoryItemId !== null,
    );

    if (needDeductInventoryProdVar.length > 0) {
      const inventory = await findInventoryByStoreFields({
        keyFields: { storeId: data.storeId },
        connection,
      });
      const componentVar: Partial<InventoryItemInterface>[] =
        needDeductInventoryProdVar.flatMap((item) => ({
          inventoryItemId: item.inventoryItemId ?? 0,
          inventoryItemQuantity: item.salesItemQuantity,
        })) ?? [];

      const inventoryMovement: CreateInventoryMovementDto[] =
        componentVar.map((item) => ({
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
        updates: componentVar,
        keyFields: ["inventoryItemId"],
      });
      await createInventoryMovement({ connection, data: inventoryMovement });
    }

    const salesDiscounts: CreateSalesDiscount[] =
      data.saleDiscounts?.map((dis) => ({
        ...dis,
        saleId: salesId,
      })) ?? [];
    if (salesDiscounts.length > 0) {
      await createSalesDiscounts({ connection, data: salesDiscounts });
    }

    const needDeductVariantComponentInventory = saleItemData.filter(
      (i) => i.components?.length !== 0,
    );
    if (needDeductVariantComponentInventory.length > 0) {
      const inventory = await findInventoryByStoreFields({
        keyFields: { storeId: data.storeId },
        connection,
      });
      const componentVar: Partial<InventoryItemInterface>[] =
        needDeductVariantComponentInventory.flatMap(
          (item) =>
            item.components?.flatMap((comp) => ({
              inventoryItemId: comp.inventoryItemId ?? 0,
              inventoryItemQuantity:
                comp.quantityRequired * item.salesItemQuantity,
            })) ?? [],
        ) ?? [];

      const inventoryMovement: CreateInventoryMovementDto[] =
        componentVar.map((item) => ({
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
        updates: componentVar,
        keyFields: ["inventoryItemId"],
      });
      await createInventoryMovement({ connection, data: inventoryMovement });
    }
    const createSalesTransaction: CreateTransactionDto = {
      referenceId: salesId,
      transactionAmount: data.salesTotalAmount,
      transactionCreatedBy: data.salesCreatedBy,
      transactionRef: "sale",
      transactionType: "in",
      storeId: data.storeId,
    };
    await createTransactions({
      connection: connection,
      data: createSalesTransaction,
    });
    const sales = await getSalesServices.findSalesBySaleId({
      connection,
      salesId,
      includeSaleItems: true,
    });

    await connection.commit();

    void sendEmailSalesBasePaymentMethods({ salesId });

    return sales;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
