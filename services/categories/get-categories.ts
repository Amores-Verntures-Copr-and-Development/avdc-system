import {
  selectCategories,
  selectCategoriesById,
} from "@/models/categoryModels";
import { PoolConnection } from "mysql2/promise";

export async function getCategoriesById({
  stockRoomId,
  storeId,
}: {
  stockRoomId?: number;
  storeId?: number;
}) {
  try {
    const data = selectCategoriesById({ stockRoomId, storeId });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getCategoriesByName({
  connection,
  name,
}: {
  name: string;
  connection?: PoolConnection;
}) {
  try {
    const category = await selectCategories({
      connection,
      keyFields: {
        categoryName: name,
      },
    });
    return category;
  } catch (e) {
    throw e;
  }
}
