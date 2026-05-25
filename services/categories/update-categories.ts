import { updateCategories } from "@/models/categoryModels";
import { CategoryInterface } from "@/types/categories";
import { PoolConnection } from "mysql2/promise";

export async function updateCategoriesByFields({
  connection,
  updates,
  keyFields = ["categoryId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<CategoryInterface>[];
  keyFields?: (keyof CategoryInterface)[];
}) {
  return await updateCategories({ connection, updates, keyFields });
}
