import {
  CreateSaleItemRefundDto,
  CreateSalePaymentRefundDto,
  CreateSalesRefundDto,
} from "@/dtos/sales-refund.dto";
import { getDBConnection } from "@/lib/db";
import { createSalesRefund } from "./create-sales-refunds";
import { createSalesItemRefund } from "./sales-item-refund/create-sales-item-refund";
import { createSalesPaymentRefund } from "./sales-payment-refund/create-sales-payment-refund";
import { CreateTransactionDto } from "@/dtos/transaction.dto";
import { createTransactions } from "../transaction/create-transaction";
import {
  getOwnInfoForRefund,
  getStoreSuperVisorForRefund,
} from "../user/get-user";
import bcrypt from "bcryptjs";
import { getSalesItemServices } from "../sales/sale-items/get-sale-items";
import {
  getSalesItemRefundsByFields,
  getSalesItemWithTotalRefundsByFields,
} from "./sales-item-refund/get-sales-item-refunds";
import { getSalesRefundsByFields } from "./get-sales-refund";
import { SalesItemRefund } from "@/types/sales-refund";
import { updateSalesByFields } from "../sales/update-sales";
import { SaleItems, SalesItemStatus, SalesStatus } from "@/types/sales";
import { updateSaleItemsByFields } from "../sales/sale-items/update-sale-items";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";
import { createInventoryMovement } from "../inventory/inventory-movement/create-inventory-movement";
import { findInventoryByStoreFields } from "../inventory/get-inventory";
import { InventoryItemInterface } from "@/types/inventory";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";

export async function processCreateSaleRefund({
  data,
  decoded,
  password,
}: {
  data: CreateSalesRefundDto;
  password: string;
  decoded: {
    userId: number;
    userRole: string;
    userFullName: string;
    empPosition: string;
    storeId: number | null;
  };
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    //validate first the user
    //insert first salesRefundDto
    if (!data) {
      throw new Error("No data found for sales refund!");
    }
    if (data.salesItemRefunds?.length === 0) {
      throw new Error("No data found for sales item refund!");
    }
    if (data.salesPaymentRefunds?.length === 0) {
      throw new Error("No data found for sales payment refund!");
    }

    if (decoded.empPosition === "staff") {
      if (!password) throw new Error("Supervisor password required!");

      const supervisors = await getStoreSuperVisorForRefund({
        storeId: data.storeId,
        connection: connection,
      });

      const validSupervisor = supervisors.some((s) =>
        bcrypt.compareSync(password, s.userPassword),
      );

      if (!validSupervisor) {
        throw new Error("Invalid supervisor password!");
      }
    } else {
      const user = await getOwnInfoForRefund({
        connection,
        userId: decoded.userId,
      });
      if (!user) {
        throw new Error("Invalid supervisor password!");
      }
      const validUser = bcrypt.compareSync(password, user[0].userPassword);

      if (!validUser) {
        throw new Error("Invalid password!");
      }
    }

    const refundId = await createSalesRefund({ connection: connection, data });

    if (data.salesItemRefunds && data.salesItemRefunds.length > 0) {
      const createSaleItemsRefundData: CreateSaleItemRefundDto[] =
        data.salesItemRefunds.map((i) => ({
          ...i,
          salesRefId: refundId,
        }));
      await createSalesItemRefund({
        connection: connection,
        data: createSaleItemsRefundData,
      });
    }

    if (data.salesPaymentRefunds && data.salesPaymentRefunds) {
      const createSalesPaymentRefundData: CreateSalePaymentRefundDto[] =
        data.salesPaymentRefunds.map((i) => ({
          ...i,
          salesRefId: refundId,
        }));
      await createSalesPaymentRefund({
        connection: connection,
        data: createSalesPaymentRefundData,
      });
    }

    const transactionData: CreateTransactionDto = {
      storeId: data.storeId,
      transactionAmount: data.salesRefAmount,
      transactionRef: "refund",
      transactionType: "out",
      transactionCreatedBy: data.salesRefCreatedBy,
      referenceId: refundId,
    };

    await createTransactions({ connection: connection, data: transactionData });
    //check if all items is

    const salesItems = await getSalesItemServices.findSaleItemsBySalesId({
      salesId: data.salesId,
      connection: connection,
    });

    // Return items to inventory - only for lines the user explicitly marked
    // with a restockQty (e.g. skipped for damaged/defective items), and only
    // for variants that are actually inventory-linked (direct or composite).
    const restockLines = (data.salesItemRefunds ?? []).filter(
      (r) => Number(r.restockQty) > 0,
    );

    if (restockLines.length > 0) {
      const inventory = await findInventoryByStoreFields({
        keyFields: { storeId: data.storeId },
        connection,
      });

      const directRestock: Partial<InventoryItemInterface>[] = [];
      const componentRestock: Partial<InventoryItemInterface>[] = [];

      for (const line of restockLines) {
        const saleItem = salesItems.find(
          (si) => si.salesItemId === line.salesItemId,
        );
        if (!saleItem) continue;

        // never trust the client for more than what was actually refunded
        const restockQty = Math.min(
          Number(line.restockQty),
          Number(line.salesRefItemQty),
        );
        if (restockQty <= 0) continue;

        if (saleItem.inventoryItemId) {
          directRestock.push({
            inventoryItemId: saleItem.inventoryItemId,
            inventoryItemQuantity: restockQty,
          });
        } else if (saleItem.variantComponents?.length) {
          for (const comp of saleItem.variantComponents) {
            if (!comp?.inventoryItemId) continue;
            componentRestock.push({
              inventoryItemId: comp.inventoryItemId,
              inventoryItemQuantity: comp.quantityRequired * restockQty,
            });
          }
        }
      }

      const restockAll = [...directRestock, ...componentRestock];

      if (restockAll.length > 0 && inventory[0]) {
        const inventoryMovement: CreateInventoryMovementDto[] = restockAll.map(
          (item) => ({
            inventoryId: inventory[0].inventoryId,
            inventoryItemId: item.inventoryItemId ?? 0,
            itemMovementReference: "refund",
            itemMovementQuantity: item.inventoryItemQuantity ?? 0,
            itemMovementReferenceId: refundId,
            itemMovementType: "in",
            itemMovementRemarks: "",
          }),
        );

        await updateInventoryItem({
          connection,
          fieldModes: { inventoryItemQuantity: "increment" },
          updates: restockAll,
          keyFields: ["inventoryItemId"],
        });
        await createInventoryMovement({
          connection,
          data: inventoryMovement,
        });
      }
    }

    let salesItemRefund: SalesItemRefund[] = [];
    const salesItemsCount = salesItems.reduce(
      (count, item) => Number(item.salesItemQuantity) + Number(count),
      0,
    );
    // const salesItemRefunds = await getSalesItemRefundsByFields({keyFields:{""}})
    const salesRef = await getSalesRefundsByFields({
      keyFields: { salesId: data.salesId },
      connection: connection,
    });

    const salesItemWithTotalRefs = await getSalesItemWithTotalRefundsByFields({
      keyFields: { salesId: data.salesId },
      connection,
    });

    const isAllTotalSameRefunds = salesItemWithTotalRefs.every(
      (si) => Number(si.totalItemRefunds) === Number(si.salesItemQuantity),
    );
    const equalRefundItems = salesItemWithTotalRefs.filter(
      (si) =>
        Number(si.totalItemRefunds ?? 0) === Number(si.salesItemQuantity) &&
        data.salesItemRefunds?.some(
          (sir) => si.salesItemId === sir.salesItemId,
        ) &&
        si.salesItemStatus === "active",
    );

    if (isAllTotalSameRefunds) {
      //Update all to refunded salesItems and Sales
      //c
      await updateSaleItemsByFields({
        connection: connection,
        updates: [
          { salesId: data.salesId, salesItemStatus: SalesItemStatus.RETURNED },
        ],
        keyFields: ["salesId"],
      });
      await updateSalesByFields({
        connection: connection,
        updates: [{ salesId: data.salesId, salesStatus: SalesStatus.REFUNDED }],
        keyFields: ["salesId"],
      });
    }

    if (equalRefundItems && equalRefundItems.length > 0) {
      //Update specific

      const updateSaleRefundsItemsData: Partial<SaleItems>[] =
        equalRefundItems.map((er) => ({
          salesItemId: er.salesItemId,
          salesItemStatus: SalesItemStatus.RETURNED,
        }));

      await updateSaleItemsByFields({
        connection: connection,
        updates: updateSaleRefundsItemsData,
        keyFields: ["salesItemId"],
      });
    }

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
