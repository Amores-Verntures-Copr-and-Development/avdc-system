import {
  CreateInventoryDto,
  CreateInventoryItemDto,
} from "@/dtos/inventory.dto";
import { getDBConnection } from "../lib/db";
import { PoolConnection, RowDataPacket } from "mysql2/promise";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
export type UpdateInventoryQtyMode = "replace" | "increment" | "decrement";
export const insertInventory = async (data: CreateInventoryDto) => {
  const pool = await getDBConnection();
  const sql = `INSERT INTO Inventory(inventoryDescription,storeId,inventoryCreatedBy) VALUES(?,?,?)`;
  const [result] = await pool.execute(sql, [
    data.inventoryDescription,
    data.storeId,
    data.inventoryCreatedBy,
  ]);
  return result;
};

export const selectInventory = async ({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryInterface>; // dynamic filters like {inventoryId: 1, storeId: null}
}): Promise<InventoryInterface[]> => {
  const pool = await getDBConnection();

  // ✅ Start base SQL
  let sql = `SELECT * FROM Inventory WHERE 1=1`;
  const params: any[] = [];

  // ✅ Build WHERE dynamically
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }

  // ✅ Execute query
  const [rows] = await pool.execute(sql, params);
  return rows as InventoryInterface[];
};

export const insertInventoryItem = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateInventoryItemDto;
}) => {
  console.log("CreateInventoryItemDto: ", data);
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO InventoryItems(inventoryId,inventoryItemReferenceType,inventoryItemReferenceId,inventoryItemQuantity,inventoryItemMin,inventoryItemCreatedBy)
  VALUES(?,?,?,?,?,?)`;
  const [results] = await pool.execute(sql, [
    data.inventoryId,
    data.inventoryItemReferenceType,
    data.inventoryItemReferenceId,
    data.inventoryItemQuantity,
    data.inventoryItemMin,
    data.inventoryItemCreatedBy,
  ]);
  return results;
};

export const insertInventoryItemsBulk = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateInventoryItemDto[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }

  const pool = connection ? connection : await getDBConnection();

  const sql = `
    INSERT INTO InventoryItems (
      inventoryId,
      inventoryItemReferenceType,
      inventoryItemReferenceId,
      inventoryItemQuantity,
      inventoryItemMin,
      inventoryItemCreatedBy
    )
    VALUES ${data.map(() => "(?, ?, ?, ?, ?, ?)").join(", ")}
  `;

  // Flatten all values into a single array
  const values = data.flatMap((item) => [
    item.inventoryId,
    item.inventoryItemReferenceType,
    item.inventoryItemReferenceId,
    item.inventoryItemQuantity,
    item.inventoryItemMin,
    item.inventoryItemCreatedBy,
  ]);

  const [results] = await pool.execute(sql, values);
  return results;
};

export const selectInventoryItems = async ({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryInterface>; // dynamic filters like {inventoryId: 1, storeId: null}
}) => {
  const pool = await getDBConnection();

  let sql = `
    SELECT 
      ii.inventoryItemId,
      ii.inventoryId,
      ii.inventoryItemReferenceId,
      ii.inventoryItemQuantity,
      ii.inventoryItemMin,
      it.itemName,
      it.itemUnit,
      c.categoryName,
      i.storeId,
      it.itemPrice,
      it.itemId
    FROM InventoryItems ii
    LEFT JOIN Inventory i ON i.inventoryId = ii.inventoryId
    LEFT JOIN Items it ON it.itemId = ii.inventoryItemReferenceId
    LEFT JOIN Categories c ON c.categoryId = it.categoryId
    WHERE 1=1
  `;

  const params: any[] = [];

  // Build WHERE clauses dynamically
  for (const [key, value] of Object.entries(keyFields)) {
    // choose the right table alias depending on field
    const tableAlias = [
      "inventoryId",
      "inventoryItemId",
      "inventoryItemReferenceId",
    ].includes(key)
      ? "ii"
      : key === "storeId"
      ? "i"
      : key === "categoryId"
      ? "c"
      : "it";

    if (value === null) {
      sql += ` AND ${tableAlias}.${key} IS NULL`;
    } else {
      sql += ` AND ${tableAlias}.${key} = ?`;
      params.push(value);
    }
  }
  console.log("SQL: ", { sql, params });
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const updateInventoryItems = async ({
  connection,
  updates,
  keyFields = ["inventoryItemId"],
  fieldModes = {}, // 👈 optional per-field mode
}: {
  connection?: PoolConnection;
  updates: Partial<InventoryItemInterface>[];
  keyFields?: (keyof InventoryItemInterface)[];
  fieldModes?: Partial<
    Record<keyof InventoryItemInterface, UpdateInventoryQtyMode>
  >;
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  // ✅ Determine all updatable fields (exclude key fields)
  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof InventoryItemInterface)
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // ✅ Build CASE WHEN per field
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add key values + update value
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    // 👇 Determine how to apply the value (replace, increment, decrement)
    const mode = fieldModes[field as keyof InventoryItemInterface] ?? "replace";
    let clause = "";

    switch (mode) {
      case "increment":
        clause = `${field} = ${field} + CASE ${caseParts.join(" ")} END`;
        break;
      case "decrement":
        clause = `${field} = ${field} - CASE ${caseParts.join(" ")} END`;
        break;
      default:
        clause = `${field} = CASE ${caseParts.join(" ")} END`;
        break;
    }

    setClauses.push(clause);
  }

  // ✅ WHERE clause (unique key combinations)
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

  // Add WHERE params
  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE InventoryItems
    SET ${setClauses.join(", ")},
        inventoryItemUpdatedAt = NOW()
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);
  return result;
};
