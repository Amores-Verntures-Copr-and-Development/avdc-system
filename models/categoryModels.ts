import { getDBConnection } from "../lib/db";
import { CreateCategoryDto } from "@/dtos/category.dto";
import { assertKnownColumns } from "@/lib/db/assertKnownColumns";
import { CategoryInterface } from "@/types/categories";
import { PoolConnection, RowDataPacket } from "mysql2/promise";

// Column names are interpolated directly into raw SQL below (CASE/WHERE
// builders) - allowlisting against the real Categories columns prevents a
// crafted request body (only loosely typed as Partial<CategoryInterface>)
// from injecting arbitrary SQL via an object key.
const CATEGORY_COLUMNS = new Set<keyof CategoryInterface>([
  "categoryId",
  "categoryName",
  "categoryType",
  "categoryReferenceType",
  "categoryReferenceId",
  "categoryCreatedAt",
  "categoryUpdatedAt",
  "categoryDeletedAt",
  "categoryCreatedBy",
]);

export const insertCategory = async (data: CreateCategoryDto) => {
  const pool = await getDBConnection();
  const sql = `INSERT INTO Categories(categoryName,categoryType,categoryCreatedBy,categoryReferenceType,categoryReferenceId) VALUES(?,?,?,?,?)`;
  const [rows] = await pool.execute(sql, [
    data.categoryName,
    data.categoryType,
    data.categoryCreatedBy,
    data.categoryReferenceType,
    data.categoryReferenceId,
  ]);
  return rows;
};

export const selectCategories = async ({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<CategoryInterface>;
  connection?: PoolConnection;
}): Promise<CategoryInterface[]> => {
  const pool = connection ? connection : await getDBConnection();

  const params: any[] = [];
  let sql = `SELECT * FROM Categories WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as CategoryInterface[];
};

export const selectCategoriesById = async ({
  stockRoomId,
  storeId,
}: {
  stockRoomId?: number;
  storeId?: number;
}) => {
  const whereClauses: string[] = [];
  const values: any[] = [];
  const pool = await getDBConnection();
  if (stockRoomId) {
    whereClauses.push(
      `categoryReferenceId = ? AND categoryReferenceType = "stock-room"`,
    );
    values.push(stockRoomId);
  }
  if (storeId) {
    whereClauses.push(
      `categoryReferenceId = ? AND categoryReferenceType = "stores"`,
    );
    values.push(storeId);
  }

  whereClauses.push(`categoryDeletedAt IS NULL`);
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM Categories ${whereSQL}`;
  const [result] = await pool.execute(sql, values);
  return result;
};

export const selectCategoriesByInventoryId = async ({
  inventoryId,
}: {
  inventoryId: number;
}) => {
  const pool = await getDBConnection();

  const sql = `SELECT DISTINCT c.*
FROM InventoryItems ii
LEFT JOIN Inventories i ON i.inventoryId = ii.inventoryId
LEFT JOIN Items it ON it.itemId = ii.inventoryItemReferenceId
LEFT JOIN Categories c ON c.categoryId = it.categoryId
WHERE ii.inventoryId = ? 
ORDER BY c.categoryName ASC;`;
  const [result] = await pool.execute(sql, [inventoryId]);
  return result;
};

export const updateCategories = async ({
  connection,
  updates,
  keyFields = ["categoryId"],
  excludedFields = ["categoryCreatedAt", "categoryUpdatedAt"],
}: {
  connection?: PoolConnection;
  updates: Partial<CategoryInterface>[];
  keyFields?: (keyof CategoryInterface)[];
  excludedFields?: (keyof CategoryInterface)[];
}) => {
  const pool = connection ?? (await getDBConnection());

  if (!updates || updates.length === 0) return;

  assertKnownColumns(keyFields, CATEGORY_COLUMNS, "Categories");
  assertKnownColumns(Object.keys(updates[0]), CATEGORY_COLUMNS, "Categories");

  const updateFields = Object.keys(updates[0]).filter(
    (field) =>
      !keyFields.includes(field as keyof CategoryInterface) &&
      !excludedFields.includes(field as keyof CategoryInterface),
  );

  if (updateFields.length === 0) {
    throw new Error("No fields to update.");
  }

  const setClauses: string[] = [];
  const params: any[] = [];

  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");

      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // key values
      keyFields.forEach((k) => params.push((row as any)[k]));

      // field value
      params.push((row as any)[field]);
    }

    setClauses.push(
      `${field} = (CASE ${caseParts.join(" ")} ELSE ${field} END)`,
    );
  }

  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k]),
  );

  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE Categories
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);

  return result;
};
