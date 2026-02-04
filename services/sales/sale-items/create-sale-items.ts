import { CreateSaleItemDisc, CreateSaleItemDto } from "@/dtos/sales.dto";
import { insertSaleItemDiscounts, insertSaleItems } from "@/models/saleModel";

import { PoolConnection } from "mysql2/promise";

export async function createSaleItems({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateSaleItemDto[];
}) {
  try {
    // Insert sale items
    const insertedIds = await insertSaleItems({ connection, data });
    console.log({ insertedIds });

    // Filter items with discounts
    const itemsWithDiscounts = data
      .map((item, index) => ({ item, id: insertedIds[index] }))
      .filter(
        ({ item }) => item.salesItemDiscounts && item.salesItemDiscounts.length,
      );

    // Prepare discounts for insertion
    const allDiscounts: CreateSaleItemDisc[] = [];

    for (const { item, id } of itemsWithDiscounts) {
      const discountsForItem: CreateSaleItemDisc[] =
        item.salesItemDiscounts!.map((d) => ({
          salesItemDiscCreatedBy: d.salesItemDiscCreatedBy,
          discountId: d.discountId,
          discountAmount: d.discountAmount,
          salesItemId: id, // ← assign the inserted ID here
        }));

      allDiscounts.push(...discountsForItem);
    }

    // Now insert all discounts into the database
    if (allDiscounts.length > 0) {
      console.log({ allDiscounts });
      await insertSaleItemDiscounts({ connection, data: allDiscounts });
    }

    return insertedIds;
  } catch (e) {
    throw e;
  }
}
