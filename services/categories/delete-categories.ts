import { CategoryInterface } from "@/types/categories";
import { PoolConnection } from "mysql2/promise";
import { handleUpdateItems } from "../items/update-items";
import { findItemsByFields } from "../items/get-item";
import { updateCategoriesByFields } from "./update-categories";

export async function deleteCategoriesByFields({
  connection,
  updates,
  keyFields = ["categoryId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<CategoryInterface>[];
  keyFields?: (keyof CategoryInterface)[];
}) {
  await updateCategoriesByFields({
    keyFields: keyFields,
    updates: updates,
    connection,
  });
}
