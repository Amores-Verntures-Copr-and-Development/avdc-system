import { CreateItemDto, ImportItemDto, ImportItemInfo } from "@/dtos/items.dto";
import { getCategoriesByName } from "../categories/get-categories";
import { getDBConnection } from "@/lib/db";
import { CreateInventoryItemDto } from "@/dtos/inventory.dto";
import { createItem } from "./create-items";
import { createInventoryItems } from "../inventory/inventory-items/create-inventory-items";

export async function processImportItems(data: ImportItemInfo) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    //search first the categoryId
    const itemData: CreateItemDto[] = await Promise.all(
      data.items.map(async (items) => {
        const category = await getCategoriesByName({
          connection,
          name: items.categoryName,
        });

        return {
          itemName: items.itemName,
          categoryId: category[0].categoryId,
          itemAddedBy: items.itemAddedBy,
          itemDescription: items.itemDescription,
          itemUnit: items.itemUnit,
          itemPrice: items.itemPrice,
        };
      }),
    );

    const inventoryItems: CreateInventoryItemDto[] = await Promise.all(
      itemData.map(async (item) => {
        const id = await createItem({ data: item, connection });
        return {
          inventoryId: data.inventoryId,
          inventoryItemReferenceType: "item",
          inventoryItemReferenceId: id,
          inventoryItemMin: 0,
          inventoryItemQuantity: 0,
          inventoryItemCreatedBy: item.itemAddedBy,
        };
      }),
    );
    await createInventoryItems({ data: inventoryItems, connection });

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
