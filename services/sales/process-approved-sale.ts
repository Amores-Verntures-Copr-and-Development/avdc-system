import { getDBConnection } from "@/lib/db";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { CreateTransactionDto } from "@/dtos/transaction.dto";
import { InventoryItemInterface } from "@/types/inventory";
import { SalesStatus } from "@/types/sales";
import { getSalesServices } from "./get-sales";
import { updateSalesByFields } from "./update-sales";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";
import { findInventoryByStoreFields } from "../inventory/get-inventory";
import { createInventoryMovement } from "../inventory/inventory-movement/create-inventory-movement";
import { createTransactions } from "../transaction/create-transaction";
import { getVariantComponents } from "../products/product-variant/variant-component/get-variant-components";
import { selectProductVariants } from "@/models/productModel";
import { sendEmailSalesBasePaymentMethods } from "./send-email-sales";

// Replays the inventory deduction / transaction steps process-create-sales.ts
// skips for a pending_approval sale. Both the direct-deduct inventoryItemId
// and the kit/bundle component recipe are re-derived from ProductVariants/
// VariantComponents by prodVarId since they're static config, not per-sale
// data - SalesItems itself doesn't (and shouldn't) persist a copy.
export async function processApprovedSale({
  salesId,
  approvedBy,
}: {
  salesId: number;
  approvedBy: number;
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [sales] = await getSalesServices.findSalesBySaleId({
      connection,
      salesId,
      includeSaleItems: true,
    });

    if (!sales) {
      throw new Error("Sale not found");
    }
    if (sales.salesStatus !== SalesStatus.PENDING_APPROVAL) {
      throw new Error("Only a pending-approval sale can be approved");
    }

    const saleItems = sales.saleItems ?? [];

    const directDeductions: Partial<InventoryItemInterface>[] = [];
    const componentDeductions: Partial<InventoryItemInterface>[] = [];
    for (const item of saleItems as any[]) {
      const variants = await selectProductVariants({
        keyFields: { prodVarId: item.prodVarId },
        connection,
      });
      const variant = variants?.[0] as { inventoryItemId?: number | null } | undefined;
      if (variant?.inventoryItemId) {
        directDeductions.push({
          inventoryItemId: variant.inventoryItemId,
          inventoryItemQuantity: item.salesItemQuantity,
        });
      }

      const components = await getVariantComponents({
        keyFields: { prodVarId: item.prodVarId },
        connection,
      });
      for (const comp of components ?? []) {
        componentDeductions.push({
          inventoryItemId: comp.inventoryItemId,
          inventoryItemQuantity:
            comp.quantityRequired * item.salesItemQuantity,
        });
      }
    }

    const allDeductions = [...directDeductions, ...componentDeductions];
    if (allDeductions.length > 0) {
      const inventory = await findInventoryByStoreFields({
        keyFields: { storeId: sales.storeId },
        connection,
      });
      const inventoryMovement: CreateInventoryMovementDto[] =
        allDeductions.map((item) => ({
          inventoryId: inventory[0].inventoryId,
          inventoryItemId: item.inventoryItemId ?? 0,
          itemMovementReference: "sales",
          itemMovementQuantity: item.inventoryItemQuantity ?? 0,
          itemMovementReferenceId: salesId,
          itemMovementType: "out",
          itemMovementRemarks: "",
        }));

      await updateInventoryItem({
        connection,
        fieldModes: { inventoryItemQuantity: "decrement" },
        updates: allDeductions,
        keyFields: ["inventoryItemId"],
      });
      await createInventoryMovement({ connection, data: inventoryMovement });
    }

    const createSalesTransaction: CreateTransactionDto = {
      referenceId: salesId,
      transactionAmount: sales.salesTotalAmount,
      transactionCreatedBy: sales.salesCreatedBy,
      transactionRef: "sale",
      transactionType: "in",
      storeId: sales.storeId,
    };
    await createTransactions({ connection, data: createSalesTransaction });

    const approvedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    await updateSalesByFields({
      connection,
      updates: [
        {
          salesId,
          salesStatus: SalesStatus.COMPLETED,
          salesApprovedBy: approvedBy,
          salesApprovedAt: approvedAt,
        },
      ],
      keyFields: ["salesId"],
    });

    await connection.commit();

    void sendEmailSalesBasePaymentMethods({ salesId });

    return await getSalesServices.findSalesBySaleId({
      salesId,
      includeSaleItems: true,
    });
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
