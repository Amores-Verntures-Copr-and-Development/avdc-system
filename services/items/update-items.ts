import { CreateItemPriceDto } from "@/dtos/items.dto";
import { insertItemPrice, updateItems } from "@/models/itemModel";
import { ItemInterface } from "@/types/items";
import { PoolConnection } from "mysql2/promise";

export async function handleUpdateItems({
  connection,
  updates,
  keyFields = ["itemId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<ItemInterface>[];
  keyFields?: (keyof ItemInterface)[];
}) {
  try {
    const res = await updateItems({ connection, updates, keyFields });
    return res;
  } catch (e) {
    throw e;
  }
}

export async function handleUpdateItemPrice({
  connection,
  updates,
  keyFields = ["itemId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<ItemInterface>[];
  keyFields?: (keyof ItemInterface)[];
}) {
  try {
    const updateItemPrice: Partial<ItemInterface>[] = updates.map((item) => ({
      itemId: item.itemId,
      itemPrice: Number(item.itemPrice),
    }));

    const res = await updateItems({
      connection,
      updates: updateItemPrice,
      keyFields,
    });

    const itemPricesPromises = updates.map(async (item) => {
      // Your async logic here

      // Ensure all values are defined
      if (!item.itemId || !item.itemPrice || !item.itemAddedBy) {
        return null; // Skip this item
      }

      return {
        itemId: item.itemId,
        itemPriceAmount: Number(item.itemPrice),
        itemPriceCreatedBy: item.itemAddedBy,
      };
    });

    // Resolve all promises and filter out null values
    const itemPricesResults = await Promise.all(itemPricesPromises);
    const itemPrices: CreateItemPriceDto[] = itemPricesResults.filter(
      (item): item is CreateItemPriceDto => item !== null,
    );

    await insertItemPrice({ connection, data: itemPrices });
    return res;
  } catch (e) {
    throw e;
  }
}
