import {
  CreateInventoryDto,
  CreateInventoryItemDto,
  CreateInventoryMovementDto,
} from "@/dtos/inventory.dto";
import { getDBConnection } from "../lib/db";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {
  InventoryInterface,
  InventoryItemInterface,
  InventoryItemMovement,
} from "@/types/inventory";
import { StockPurchasers } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
export type UpdateInventoryQtyMode = "replace" | "increment" | "decrement";
export const insertInventory = async ({
  data,
  connection,
}: {
  data: CreateInventoryDto;
  connection: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Inventories(inventoryDescription,inventoryReference,inventoryReferenceId,inventoryCreatedBy) VALUES(?,?,?,?)`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.inventoryDescription,
    data.inventoryReference,
    data.inventoryReferenceId,
    data.inventoryCreatedBy,
  ]);
  return result.insertId;
};

export const selectInventory = async ({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryInterface>; // dynamic filters like {inventoryId: 1, storeId: null}
}): Promise<InventoryInterface[]> => {
  const pool = await getDBConnection();

  // ✅ Start base SQL
  let sql = `SELECT * FROM Inventories i
  LEFT JOIN Stores s ON s.storeId = i.inventoryReferenceId AND i.inventoryReference = 'store'
  LEFT JOIN StockRooms sr ON sr.stockRoomId = i.inventoryReferenceId AND i.inventoryReference = 'stock-room'    WHERE 1=1`;
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

export const selectInventoryByStockPurchaserFields = async ({
  keyFields = {},
}: {
  keyFields?: Partial<StockPurchasers>; // dynamic filters like {inventoryId: 1, storeId: null}
}) => {
  const pool = await getDBConnection();
  const params: any[] = [];
  let sql = `SELECT i.* FROM Inventories i
LEFT JOIN StockRooms sr ON sr.stockRoomId = i.inventoryReferenceId AND i.inventoryReference = 'stock-room'
LEFT JOIN StockPurchasers sp ON sp.stockRoomId = sr.stockRoomId 
WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND sp.${key} IS NULL`;
    } else {
      sql += ` AND sp.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const selectInventoryByStoreFields = async ({
  keyFields = {},
}: {
  keyFields?: Partial<StoreInterface>; // dynamic filters like {inventoryId: 1, storeId: null}
}) => {
  const pool = await getDBConnection();
  const params: any[] = [];
  let sql = `SELECT i.* FROM Inventories i
LEFT JOIN Stores s ON s.storeId = i.inventoryReferenceId AND i.inventoryReference = 'store'
WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND s.${key} IS NULL`;
    } else {
      sql += ` AND s.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
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
      ii.inventoryItemReferenceType,
      ii.inventoryItemReferenceId,
      ii.inventoryItemQuantity,
      ii.inventoryItemMin,
      it.itemName,
      it.itemUnit,
      c.categoryName,
      it.itemPrice,
      it.itemId
    FROM InventoryItems ii
    LEFT JOIN Inventories i ON i.inventoryId = ii.inventoryId
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
      "inventoryItemReference",
    ].includes(key)
      ? "ii"
      : key === "storeId"
      ? "i"
      : key === "categoryId"
      ? "c"
      : "i";

    if (value === null) {
      sql += ` AND ${tableAlias}.${key} IS NULL`;
    } else {
      sql += ` AND ${tableAlias}.${key} = ?`;
      params.push(value);
    }
  }
  sql += ` ORDER BY it.itemName ASC`;
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

export const insertInventoryMovement = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateInventoryMovementDto[];
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `
    INSERT INTO InventoryItemMovements (
      inventoryId,
      inventoryItemId,
      itemMovementType,
      itemMovementReferenceId,
      itemMovementReference,
      itemMovementQuantity,
      itemMovementRemarks
    )
    VALUES ${data.map(() => "(?, ?, ?, ?, ?, ?,?)").join(", ")}
  `;
  const values = data.flatMap((item) => [
    item.inventoryId,
    item.inventoryItemId,
    item.itemMovementType,
    item.itemMovementReferenceId,
    item.itemMovementReference,
    item.itemMovementQuantity,
    item.itemMovementRemarks,
  ]);

  const [results] = await pool.execute(sql, values);
  return results;
};

export const selectInventoryMovementItems = async ({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryItemMovement>; // dynamic filters like {inventoryId: 1, storeId: null}
}) => {
  const pool = await getDBConnection();
  let sql = `SELECT iim.invItemMovementId,iim.inventoryId,iim.inventoryItemId,iim.itemMovementType,iim.itemMovementReferenceId,iim.itemMovementReference,
iim.itemMovementQuantity,iim.itemMovementRemarks,iim.itemMovementCreatedAt,i.itemId,i.itemName,i.itemUnit,i.itemPrice,c.categoryName,c.categoryType
 FROM InventoryItemMovements iim
LEFT JOIN InventoryItems ii ON ii.inventoryItemId = iim.inventoryItemId
LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId AND ii.inventoryItemReferenceType = "item"
LEFT JOIN Categories c ON c.categoryId = i.categoryId WHERE 1=1`;
  const params: any[] = [];

  // ✅ Build WHERE dynamically
  for (const [key, value] of Object.entries(keyFields)) {
    // choose the right table alias depending on field
    const tableAlias = ["inventoryId"].includes(key)
      ? "iim"
      : key === "inventoryId"
      ? "iim"
      : key === "categoryId"
      ? "c"
      : key === "inventoryItemId"
      ? "iim"
      : "it";

    if (value === null) {
      sql += ` AND ${tableAlias}.${key} IS NULL`;
    } else {
      sql += ` AND ${tableAlias}.${key} = ?`;
      params.push(value);
    }
  }
  sql += ` ORDER BY iim.itemMovementCreatedAt DESC`;
  const [rows] = await pool.execute(sql, params);
  return rows;
};

export const selectInventoryItemsStockStatus = async (inventoryId: number) => {
  const pool = await getDBConnection();
  const sql = `SELECT 
  COUNT(ii.inventoryItemId) AS totalItems,
  SUM(CASE WHEN ii.inventoryItemQuantity > ii.inventoryItemMin THEN 1 ELSE 0 END) AS goodStock,
  SUM(CASE WHEN ii.inventoryItemQuantity <= ii.inventoryItemMin AND ii.inventoryItemQuantity > 0 THEN 1 ELSE 0 END) AS lowStock,
  SUM(CASE WHEN ii.inventoryItemQuantity = 0 THEN 1 ELSE 0 END) AS outStock
  FROM Inventories i
  LEFT JOIN InventoryItems ii ON ii.inventoryId = i.inventoryId WHERE i.inventoryId = ?`;
  const [rows] = await pool.execute(sql, [inventoryId]);
  return rows;
};

export const selectStockRoomInventoryItems = async (purchaserId: number) => {
  const pool = await getDBConnection();
  const sql = `SELECT * FROM StockRooms sr
  LEFT JOIN Inventories i ON i.inventoryReferenceId = sr.stockRoomId AND i.inventoryReference = 'stock-room' 		
  LEFT JOIN InventoryItems ii ON ii.inventoryId = i.inventoryId
  LEFT JOIN StockPurchasers sp ON sp.stockRoomId = sr.stockRoomId
  WHERE sp.userId = ?`;
  const [rows] = await pool.execute(sql, [purchaserId]);
  return rows;
};
