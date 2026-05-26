import { CategoryInterface } from "@/types/categories";
import { PoolConnection } from "mysql2/promise";
import { handleUpdateItems } from "../items/update-items";
import { findItemsByFields } from "../items/get-item";
import { updateCategoriesByFields } from "./update-categories";
import { deleteCategoriesByFields } from "./delete-categories";
import { getDBConnection } from "@/lib/db";

export async function processDeleteCategoriesByFields({
  connection,
  updates,
  keyFields = ["categoryId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<CategoryInterface>[];
  keyFields?: (keyof CategoryInterface)[];
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
    const items = await findItemsByFields({
      arrayFields: { categoryId: updates.map((update) => update.categoryId) },
    });
    console.log({ items });
    if (items && items.length > 0) {
      await handleUpdateItems({
        updates: items.map((i) => ({ itemId: i.itemId, categoryId: null })),
        keyFields: ["itemId"],
      });
    }

    await deleteCategoriesByFields({
      keyFields: keyFields,
      updates: updates,
    });
    if (localConnection) {
      await newConnection.commit();
    }
    //null
  } catch (e) {
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
