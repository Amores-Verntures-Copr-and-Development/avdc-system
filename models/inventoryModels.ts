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
  connection,
}: {
  keyFields?: Partial<StoreInterface>;
  connection?: PoolConnection; // dynamic filters like {inventoryId: 1, storeId: null}
}) => {
  const pool = connection ? connection : await getDBConnection();
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
  return rows as InventoryInterface[];
};

export const selectInventoryByRequestId = async ({
  id,
}: {
  id: number; // dynamic filters like {inventoryId: 1, storeId: null}
}) => {
  const pool = await getDBConnection();
  const sql = ` 
 SELECT i.* FROM Inventories i
 LEFT JOIN Stores s ON s.storeId = i.inventoryReferenceId AND i.inventoryReference = 'store'
 LEFT JOIN RequestOrders ro ON ro.storeId = s.storeId
 WHERE ro.requestId = ?`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [id]);
  return rows as InventoryInterface[];
};

export const insertInventoryItem = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateInventoryItemDto;
}) => {
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
  search,
  status,
  category,
  unit,
  limit,
  offset,
  connection,
  movement,
}: {
  keyFields?: Partial<InventoryInterface>;
  search?: string;
  status?: string;
  category?: string;
  unit?: string;
  limit?: number;
  offset?: number;
  connection?: PoolConnection;
  movement?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
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
  it.itemId,
  (SELECT SUM(iim.itemMovementQuantity) FROM InventoryItemMovements iim WHERE iim.itemMovementType = 'in' AND iim.inventoryItemId = ii.inventoryItemId) AS inStock,
  (SELECT SUM(iim.itemMovementQuantity) FROM InventoryItemMovements iim WHERE iim.itemMovementType = 'out' AND iim.inventoryItemId = ii.inventoryItemId) AS outStock,
  COALESCE(
    JSON_ARRAYAGG(
      CASE 
        WHEN s.suppId IS NOT NULL THEN  -- 👈 Filter NULL suppliers
          JSON_OBJECT(
            'suppId', s.suppId,
            'suppName', s.suppName,
            'suppItemPrice', si.suppItemPrice
          )
        ELSE NULL
      END
    ),
    JSON_ARRAY()
  ) AS itemSuppliers
FROM InventoryItems ii
LEFT JOIN Inventories i ON i.inventoryId = ii.inventoryId
LEFT JOIN Items it ON it.itemId = ii.inventoryItemReferenceId
LEFT JOIN Categories c ON c.categoryId = it.categoryId
LEFT JOIN SupplierItems si ON si.itemId = ii.inventoryItemReferenceId AND ii.inventoryItemReferenceType = 'item' AND si.suppItemStatus != 'deleted'
LEFT JOIN Suppliers s ON s.suppId = si.suppId
WHERE 1=1 AND ii.inventoryItemDeletedAt IS NULL 
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
      "inventoryItemReferenceType",
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
  if (search) {
    const wildcard = `%${search}%`;
    sql += ` AND it.itemName LIKE ? `;
    params.push(wildcard);
  }
  if (category) {
    sql += ` AND c.categoryName = ? `;
    params.push(category);
  }
  if (unit) {
    sql += ` AND it.itemUnit = ? `;
    params.push(unit);
  }
  if (status) {
    if (status === "good") {
      sql += ` AND ii.inventoryItemQuantity > 0 `;
    }
    if (status === "low") {
      sql += ` AND ii.inventoryItemQuantity < ii.inventoryItemMin AND ii.inventoryItemQuantity != 0  `;
    }
    if (status === "no") {
      sql += ` AND ii.inventoryItemQuantity = 0 `;
    }
  }

  sql += ` GROUP BY  
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
  ORDER BY `;

  if (!status) {
    sql += `  CASE WHEN ii.inventoryItemQuantity > 0 THEN 0 ELSE 1 END,`;
  }
  sql += ` it.itemName ASC`;
  if (limit !== undefined) {
    sql += ` LIMIT ${limit}`;
  }
  if (offset !== undefined) {
    sql += ` OFFSET ${offset}`;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows;
};

export const selectInventoryItemsCount = async ({
  keyFields = {},
  search,
  status,
  category,
  unit,
  connection,
  movement,
}: {
  keyFields?: Partial<InventoryInterface>;
  search?: string;
  status?: string;
  category?: string;
  unit?: string;
  limit?: number;
  offset?: number;
  connection?: PoolConnection;
  movement?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `
    SELECT 
COUNT(DISTINCT ii.inventoryItemId) as totalItems
FROM InventoryItems ii
LEFT JOIN Inventories i ON i.inventoryId = ii.inventoryId
LEFT JOIN Items it ON it.itemId = ii.inventoryItemReferenceId
LEFT JOIN Categories c ON c.categoryId = it.categoryId
LEFT JOIN SupplierItems si ON si.itemId = ii.inventoryItemReferenceId AND ii.inventoryItemReferenceType = 'item'
LEFT JOIN Suppliers s ON s.suppId = si.suppId
WHERE 1=1 AND ii.inventoryItemDeletedAt IS NULL
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
      "inventoryItemReferenceType",
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
  if (search) {
    const wildcard = `%${search}%`;
    sql += ` AND it.itemName LIKE ? `;
    params.push(wildcard);
  }
  if (category) {
    sql += ` AND c.categoryName = ? `;
    params.push(category);
  }
  if (unit) {
    sql += ` AND it.itemUnit = ? `;
    params.push(unit);
  }
  if (status) {
    if (status === "good") {
      sql += ` AND ii.inventoryItemQuantity > 0 `;
    }
    if (status === "low") {
      sql += ` AND ii.inventoryItemQuantity < ii.inventoryItemMin AND ii.inventoryItemQuantity != 0  `;
    }
    if (status === "no") {
      sql += ` AND ii.inventoryItemQuantity = 0 `;
    }
  }
  if (movement === "fast") {
    sql += ` AND ii.inventoryItemId IN (
    SELECT inventoryItemId
    FROM InventoryItemMovement
    WHERE itemMovementType = 'out'
      AND itemMovementCreatedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY inventoryItemId
    HAVING SUM(itemMovementQuantity) >= ?
  ) `;
    params.push(Number(movement)); // e.g., fast = 20
  }

  if (movement === "slow") {
    sql += ` AND ii.inventoryItemId IN (
    SELECT inventoryItemId
    FROM InventoryItemMovement
    WHERE itemMovementType = 'out'
      AND itemMovementCreatedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY inventoryItemId
    HAVING SUM(itemMovementQuantity) <= ?
  ) `;
    params.push(Number(movement)); // e.g., slow = 5
  }
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
    (field) => !keyFields.includes(field as keyof InventoryItemInterface),
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
    item.itemMovementRemarks || null,
  ]);
  const [results] = await pool.execute(sql, values);
  return results;
};

export const selectInventoryMovementItems = async ({
  keyFields = {},
  search,
  from,
  to,
  type,
  category,
}: {
  keyFields?: Partial<InventoryItemMovement>;
  search?: string;
  from?: string;
  to?: string;
  type?: string;
  category?: string;
  // dynamic filters like {inventoryId: 1, storeId: null}
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
  console.log({ search });
  if (search) {
    sql += ` AND i.itemName LIKE ?`;
    params.push(`%${search}%`);
  }

  if (from && to) {
    sql += ` AND DATE(iim.itemMovementCreatedAt) BETWEEN ? AND ?`;
    params.push(from);
    params.push(to);
  }
  if (type) {
    sql += ` AND iim.itemMovementType = ?`;

    params.push(type);
  }
  if (category) {
    sql += ` AND c.categoryName = ?`;
    params.push(category);
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
  SUM(CASE WHEN ii.inventoryItemQuantity = 0 THEN 1 ELSE 0 END) AS outStock,
  SUM(ii.inventoryItemQuantity * it.itemPrice) AS totalCost
FROM Inventories i
LEFT JOIN InventoryItems ii ON ii.inventoryId = i.inventoryId
LEFT JOIN Items it ON it.itemId = ii.inventoryItemReferenceId
WHERE i.inventoryId = ?`;
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

export const selectInventoryItemUnitById = async (inventoryId: number) => {
  const pool = await getDBConnection();
  const sql = `SELECT DISTINCT it.itemUnit
  FROM InventoryItems ii
  LEFT JOIN Inventories i ON i.inventoryId = ii.inventoryId
  LEFT JOIN Items it ON it.itemId = ii.inventoryItemReferenceId
  LEFT JOIN Categories c ON c.categoryId = it.categoryId
  WHERE ii.inventoryId = ? 
  ORDER BY it.itemUnit ASC;`;
  const [rows] = await pool.execute(sql, [inventoryId]);
  return rows;
};

export const selectInventoryItemReport = async ({
  range,
  inventoryId,
}: {
  inventoryId: number;
  range: { from: string; to: string };
}) => {
  const pool = await getDBConnection();
  const sql = ` SELECT 
    ii.inventoryItemId,
    ii.inventoryId,
    ii.inventoryItemReferenceId,
    ii.inventoryItemReferenceType,
    ii.inventoryItemQuantity AS currentInventoryQuantity,
    i.itemName,
    i.itemUnit,
    c.categoryName,
    (SELECT COALESCE(SUM(iim.itemMovementQuantity), 0) 
     FROM InventoryItemMovements iim 
     WHERE iim.inventoryItemId = ii.inventoryItemId 
     AND iim.itemMovementType = 'in' 
     AND DATE(iim.itemMovementCreatedAt) BETWEEN ? AND ?) AS itemIn, 
    (SELECT COALESCE(SUM(iim.itemMovementQuantity), 0) 
     FROM InventoryItemMovements iim 
     WHERE iim.inventoryItemId = ii.inventoryItemId 
     AND iim.itemMovementType = 'out' 
     AND DATE(iim.itemMovementCreatedAt) BETWEEN ? AND ?) AS itemOut,
    -- Calculate starting inventory (before the date range)
    (ii.inventoryItemQuantity - 
     (SELECT COALESCE(SUM(CASE WHEN iim.itemMovementType = 'in' THEN iim.itemMovementQuantity ELSE -iim.itemMovementQuantity END), 0)
      FROM InventoryItemMovements iim 
      WHERE iim.inventoryItemId = ii.inventoryItemId 
      AND DATE(iim.itemMovementCreatedAt) > ?)) AS startingInventory
FROM InventoryItems ii
LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId AND ii.inventoryItemReferenceType = 'item'
LEFT JOIN Categories c ON c.categoryId = i.categoryId
WHERE ii.inventoryId = ?
ORDER BY 
    itemOut DESC,
    itemIn DESC,
    i.itemName ASC`;
  const [rows] = await pool.execute(sql, [
    range.from,
    range.to,
    range.from,
    range.to,
    range.from,
    inventoryId,
  ]);
  return rows;
};
