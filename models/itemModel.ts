import {
  CreateItemDto,
  CreateItemPriceDto,
  ImportItemInfo,
} from "@/dtos/items.dto";
import { ResultSetHeader } from "mysql2/promise";
import { getDBConnection } from "../lib/db";
import { PoolConnection } from "mysql2/promise";
import { processImportItems } from "@/services/items/processImportItems";
import { ItemInterface } from "@/types/items";

export const insertItem = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateItemDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Items(itemName,itemDescription,itemPrice,itemUnit,itemAddedBy,categoryId) 
  VALUES(?,?,?,?,?,?)  `;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.itemName,
    data.itemDescription,
    data.itemPrice,
    data.itemUnit,
    data.itemAddedBy,
    data.categoryId,
  ]);
  return results.insertId;
};

export const insertItemPrice = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateItemPriceDto[];
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO ItemPrices(itemPriceAmount,itemPriceCreatedBy,itemId) 
  VALUES ${data.map(() => "(?,?,?)")}  `;
  const values = data.flatMap((item) => [
    item.itemPriceAmount,
    item.itemPriceCreatedBy,
    item.itemId,
  ]);
  const [results] = await pool.execute(sql, values);
  return results;
};

// export const insertItems = async ({
//   connection,
//   data,
// }: {
//   connection?: PoolConnection;
//   data: CreateItemDto[];
// }) => {
//   const pool = connection ? connection : await getDBConnection();
//   const sql = `INSERT INTO Items(itemName,itemDescription,itemPrice,itemUnit,itemAddedBy,
//   categoryId)
//    VALUES ${data.map(() => "(?, ?, ?, ?, ?, ?)").join(", ")}`;
//   const values = data.map((item) => [
//     item.itemName,
//     item.itemDescription,
//     item.itemPrice,
//     item.itemUnit,
//     item.itemAddedBy,
//     item.categoryId,
//   ]);
//   const [results] = await pool.execute(sql, values);
//   return results;
// };

export const selectItems = async ({
  connection,
  search,
}: {
  connection?: PoolConnection;
  search?: string;
}) => {
  const whereClauses: string[] = [];
  const values: string[] = [];
  const pool = connection ? connection : await getDBConnection();
  if (search) {
    const wildcard = `%${search}%`;
    whereClauses.push(`(itemName LIKE ?)`);
    values.push(wildcard);
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM Items ${whereSQL}`;
  const [rows] = await pool.execute(sql, values);
  return rows;
};

export const updateItems = async ({
  connection,
  updates,
  keyFields = ["itemId"],
}: {
  connection?: PoolConnection;
  updates: Partial<ItemInterface>[];
  keyFields?: (keyof ItemInterface)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof ItemInterface)
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // Build SET clauses for each field to update
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add key values + update value
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    // Build the CASE statement for this field and add to setClauses
    const caseStatement = `${field} = (CASE ${caseParts.join(
      " "
    )} ELSE ${field} END)`;
    setClauses.push(caseStatement);
  }

  // Build WHERE clause
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k])
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
    UPDATE Items
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  console.log(`SQL`, { sql });
  console.log(`params`, { params });
  const [result] = await pool.execute(sql, params);
  return result;
};
