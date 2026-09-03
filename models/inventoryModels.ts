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
  InventoryReferenceType,
} from "@/types/inventory";
import { StockPurchasers } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import { assertKnownColumns } from "@/lib/db/assertKnownColumns";
import { BusinessError } from "@/lib/errors";
export type UpdateInventoryQtyMode = "replace" | "increment" | "decrement";

// Column names are interpolated directly into raw SQL below (CASE/WHERE
// builders) - allowlisting against the real InventoryItems columns prevents a
// crafted request body (e.g. the untyped `PUT /api/inventory/item/...` route,
// which does `await request.json()` with no cast at all) from injecting
// arbitrary SQL via an object key. Note: InventoryItemInterface also declares
// `inventoryItemPrice`, which is NOT a real InventoryItems column - it is
// intentionally left out of this allowlist.
const INVENTORY_ITEM_COLUMNS = new Set<keyof InventoryItemInterface>([
  "inventoryItemId",
  "inventoryId",
  "inventoryItemReferenceType",
  "inventoryItemReferenceId",
  "inventoryItemQuantity",
  "inventoryItemMin",
  "inventoryItemCreatedAt",
  "inventoryItemUpdatedAt",
  "inventoryItemDeletedAt",
  "inventoryItemCreatedBy",
]);
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
  connection,
}: {
  keyFields?: Partial<InventoryInterface>;
  connection?: PoolConnection; // dynamic filters like {inventoryId: 1, storeId: null}
}): Promise<InventoryInterface[]> => {
  const pool = connection ? connection : await getDBConnection();

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

// Resolves which store actually owns an inventory item, straight from the
// DB - used to verify a client-supplied inventoryItemId (e.g. linking a
// product variant to it) actually belongs to the acting user's own store,
// rather than trusting the id at face value.
export const selectInventoryItemStoreId = async (inventoryItemId: number) => {
  const pool = await getDBConnection();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT s.storeId AS storeId
       FROM InventoryItems ii
       JOIN Inventories i ON i.inventoryId = ii.inventoryId
       JOIN Stores s ON s.storeId = i.inventoryReferenceId AND i.inventoryReference = 'store'
      WHERE ii.inventoryItemId = ?`,
    [inventoryItemId],
  );
  return (rows[0]?.storeId as number | undefined) ?? null;
};

// Snapshot lookup for saleItemCost - resolves the *current* cost of each
// inventoryItemId at the moment a sale is created, the same way pv.inventoryItemId
// / VariantComponents.inventoryItemId resolve to Items.itemPrice for the live
// totalCost/profit figures on selectProductVariants above.
export const selectInventoryItemCosts = async ({
  connection,
  inventoryItemIds,
}: {
  connection?: PoolConnection;
  inventoryItemIds: number[];
}): Promise<Map<number, number>> => {
  const costs = new Map<number, number>();
  if (!inventoryItemIds.length) return costs;

  const pool = connection ? connection : await getDBConnection();
  const placeholders = inventoryItemIds.map(() => "?").join(",");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT ii.inventoryItemId, i.itemPrice
       FROM InventoryItems ii
       LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId
         AND ii.inventoryItemReferenceType = 'item'
      WHERE ii.inventoryItemId IN (${placeholders})`,
    inventoryItemIds,
  );

  rows.forEach((row) => {
    costs.set(row.inventoryItemId, Number(row.itemPrice) || 0);
  });

  return costs;
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
  SELECT ?,?,?,?,?,?
  FROM DUAL
  WHERE NOT EXISTS (
    SELECT 1 FROM InventoryItems
    WHERE inventoryId = ?
      AND inventoryItemReferenceType = ?
      AND inventoryItemReferenceId = ?
      AND inventoryItemDeletedAt IS NULL
  )`;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.inventoryId,
    data.inventoryItemReferenceType,
    data.inventoryItemReferenceId,
    data.inventoryItemQuantity,
    data.inventoryItemMin,
    data.inventoryItemCreatedBy,
    data.inventoryId,
    data.inventoryItemReferenceType,
    data.inventoryItemReferenceId,
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
  supplier,
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
  supplier?: string;
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
    if (category === "null" || category === null) {
      sql += ` AND c.categoryId IS NULL `;
    } else {
      sql += ` AND c.categoryName = ? `;
      params.push(category);
    }
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

  if (supplier) {
    if (supplier === "null") {
      sql += ` AND s.suppId IS NULL`;
    } else {
      sql += ` AND s.suppName = ?`;
      params.push(supplier);
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
  supplier,
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
  supplier?: string;
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
    if (category === "null" || category === null) {
      sql += ` AND c.categoryId IS NULL `;
    } else {
      sql += ` AND c.categoryName = ? `;
      params.push(category);
    }
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
  if (supplier) {
    if (supplier === "null") {
      sql += ` AND s.suppId IS NULL`;
    } else {
      sql += ` AND s.suppName = ?`;
      params.push(supplier);
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

  assertKnownColumns(keyFields, INVENTORY_ITEM_COLUMNS, "InventoryItems");
  assertKnownColumns(
    Object.keys(updates[0]),
    INVENTORY_ITEM_COLUMNS,
    "InventoryItems",
  );

  // ✅ Determine all updatable fields (exclude key fields)
  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof InventoryItemInterface),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  // Two rows can legitimately share the same key - e.g. two different sale
  // items in one order both consuming the same recipe component. Without
  // merging them first, the CASE below only applies whichever WHEN matches
  // (the others are silently dropped), and the floor guard further down
  // would check stock against a single row's amount instead of the combined
  // total. Increment/decrement amounts are summed per key; a "replace" field
  // just keeps the last value, matching a plain UPDATE's overwrite semantics.
  const mergedByKey = new Map<string, Partial<InventoryItemInterface>>();
  for (const row of updates) {
    const key = keyFields.map((k) => (row as any)[k]).join("|");
    const existing = mergedByKey.get(key);
    if (!existing) {
      mergedByKey.set(key, { ...row });
      continue;
    }
    for (const field of updateFields) {
      const mode =
        fieldModes[field as keyof InventoryItemInterface] ?? "replace";
      (existing as any)[field] =
        mode === "increment" || mode === "decrement"
          ? ((existing as any)[field] ?? 0) + ((row as any)[field] ?? 0)
          : (row as any)[field];
    }
  }
  const mergedUpdates = Array.from(mergedByKey.values());

  const setClauses: string[] = [];
  const params: any[] = [];

  // ✅ Build CASE WHEN per field
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of mergedUpdates) {
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
  const uniqueKeyCombinations = mergedUpdates.map((row) =>
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

  // A decrementing field must never be allowed to go negative - without this
  // floor, two concurrent requests decrementing the same row (e.g. two
  // checkouts racing for the last unit of stock) both unconditionally
  // succeed instead of the second one failing, since a bare UPDATE has
  // nothing to check the current value against. Row-level locking during the
  // UPDATE still serializes the two, but only this guard makes the second
  // one actually lose.
  const decrementFields = updateFields.filter(
    (field) =>
      (fieldModes[field as keyof InventoryItemInterface] ?? "replace") ===
      "decrement",
  );
  const guardClauses: string[] = [];
  for (const field of decrementFields) {
    for (const row of mergedUpdates) {
      const keyConds = keyFields.map((k) => `${k} = ?`).join(" AND ");
      // Only constrains the row it applies to - every other row is left
      // untouched by this clause.
      guardClauses.push(`(NOT (${keyConds}) OR ${field} >= ?)`);
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }
  }

  const sql = `
    UPDATE InventoryItems
    SET ${setClauses.join(", ")},
        inventoryItemUpdatedAt = NOW()
    WHERE ${whereSql}
    ${guardClauses.length > 0 ? `AND ${guardClauses.join(" AND ")}` : ""};
  `;

  const [result] = await pool.execute<ResultSetHeader>(sql, params);

  // A row rejected by the floor check (or one that no longer exists) simply
  // doesn't match the WHERE clause, so fewer rows are affected than
  // requested - that's how an out-of-stock item is detected here.
  if (guardClauses.length > 0 && result.affectedRows < mergedUpdates.length) {
    throw new BusinessError(
      "Not enough stock available for one or more items. Please refresh and try again.",
    );
  }

  return result;
};

export const insertInventoryMovement = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateInventoryMovementDto[];
}) => {
  if (!data || data.length === 0) return;

  const pool = connection ? connection : await getDBConnection();
  const sql = `
    INSERT INTO InventoryItemMovements (
      inventoryId,
      inventoryItemId,
      itemMovementType,
      itemMovementReferenceId,
      itemMovementReference,
      itemMovementQuantity,
      itemMovementRemarks,
      itemMovementReason,
      itemMovementCreatedAt
    )
    VALUES ${data.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))").join(", ")}
  `;
  // itemMovementCreatedAt defaults to CURRENT_TIMESTAMP when not passed
  // (adjustments, PO/RO receiving, refunds, etc. all happen "now") - sales
  // pass the sale's own date so a backdated sale's stock deduction is
  // logged against that date instead of whenever this insert happens to run.
  const values = data.flatMap((item) => [
    item.inventoryId,
    item.inventoryItemId,
    item.itemMovementType,
    item.itemMovementReferenceId,
    item.itemMovementReference,
    item.itemMovementQuantity,
    item.itemMovementRemarks || null,
    item.itemMovementReason || null,
    item.itemMovementCreatedAt || null,
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
  iim.itemMovementQuantity,iim.itemMovementRemarks,iim.itemMovementReason,iim.itemMovementCreatedAt,i.itemId,i.itemName,i.itemUnit,i.itemPrice,c.categoryName,c.categoryType
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

export const selectInventoryItemsNotInProdVar = async ({
  inventoryId,
}: {
  inventoryId: number;
}) => {
  const pool = await getDBConnection();
  const sql = `SELECT i.*,ii.*
FROM InventoryItems ii
LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId AND ii.inventoryItemReferenceType = 'item'
WHERE ii.inventoryId = ?
AND NOT EXISTS (
    SELECT 1
    FROM ProductVariants pv
    WHERE pv.inventoryItemId = ii.inventoryItemId
);`;
  const [rows] = await pool.execute(sql, [inventoryId]);
  return rows;
};

export const selectInventoryItemsNotInOther = async ({
  from,
  notIn,
  limit,
  skip,
  connection,
}: {
  from: number;
  notIn: number;
  limit?: number;
  skip?: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `SELECT i.itemId,i.itemUnit,i.itemName,ii.inventoryItemId,ii.inventoryId,ii.inventoryItemReferenceType,ii.inventoryItemReferenceId
FROM InventoryItems ii
LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId AND ii.inventoryItemReferenceType = 'item'
WHERE ii.inventoryId = ?
  AND ii.inventoryItemReferenceType = 'item'
  AND NOT EXISTS (
    SELECT 1
    FROM InventoryItems iis
    WHERE iis.inventoryId = ?
      AND iis.inventoryItemReferenceType = 'item'
      AND iis.inventoryItemReferenceId = ii.inventoryItemReferenceId  
      AND iis.inventoryItemDeletedAt IS NULL
  ) AND ii.inventoryItemDeletedAt IS NULL  ORDER BY i.itemName
  `;

  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  if (skip) {
    sql += ` OFFSET ${skip}`;
  }
  const [rows] = await pool.execute(sql, [from, notIn]);
  return rows;
};

export const selectCountInventoryItemsNotInOther = async ({
  from,
  notIn,
  limit,
  skip,
  connection,
}: {
  from: number;
  notIn: number;
  limit?: number;
  skip?: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `SELECT COUNT(ii.inventoryItemId) as count
FROM InventoryItems ii
LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId AND ii.inventoryItemReferenceType = 'item'
WHERE ii.inventoryId = ?
  AND ii.inventoryItemReferenceType = 'item'
  AND NOT EXISTS (
    SELECT 1
    FROM InventoryItems iis
    WHERE iis.inventoryId = ?
      AND iis.inventoryItemReferenceType = 'item'
      AND iis.inventoryItemReferenceId = ii.inventoryItemReferenceId
      AND iis.inventoryItemDeletedAt IS NULL
  ) AND ii.inventoryItemDeletedAt IS NULL
  `;
  sql += ` ORDER BY i.itemName`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [from, notIn]);
  return rows[0].count;
};

export const selectDuplicateInventoryItems = async ({
  inventoryId,
  search,
  connection,
}: {
  inventoryId: number;
  search?: string;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const searchClause = search ? "AND it.itemName LIKE ?" : "";
  const searchParams = search ? [`%${search}%`] : [];

  const sql = `SELECT
  ii.inventoryItemId,
  ii.inventoryId,
  ii.inventoryItemReferenceType,
  ii.inventoryItemReferenceId,
  ii.inventoryItemQuantity,
  ii.inventoryItemMin,
  it.itemName,
  it.itemUnit,
  c.categoryName
FROM InventoryItems ii
LEFT JOIN Items it ON it.itemId = ii.inventoryItemReferenceId AND ii.inventoryItemReferenceType = 'item'
LEFT JOIN Categories c ON c.categoryId = it.categoryId
WHERE ii.inventoryId = ?
  AND ii.inventoryItemDeletedAt IS NULL
  ${searchClause}
  AND (ii.inventoryItemReferenceType, ii.inventoryItemReferenceId) IN (
    SELECT inventoryItemReferenceType, inventoryItemReferenceId
    FROM InventoryItems
    WHERE inventoryId = ? AND inventoryItemDeletedAt IS NULL
    GROUP BY inventoryItemReferenceType, inventoryItemReferenceId
    HAVING COUNT(*) > 1
  )
ORDER BY ii.inventoryItemReferenceType, ii.inventoryItemReferenceId, ii.inventoryItemId`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [
    inventoryId,
    ...searchParams,
    inventoryId,
  ]);
  return rows;
};

export const mergeDuplicateInventoryItems = async ({
  inventoryId,
  inventoryItemReferenceType,
  inventoryItemReferenceId,
  connection,
}: {
  inventoryId: number;
  inventoryItemReferenceType?: InventoryReferenceType;
  inventoryItemReferenceId?: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const hasScope = Boolean(
    inventoryItemReferenceType && inventoryItemReferenceId,
  );
  const scopeClause = hasScope
    ? "AND inventoryItemReferenceType = ? AND inventoryItemReferenceId = ?"
    : "";
  const scopeParams = hasScope
    ? [inventoryItemReferenceType, inventoryItemReferenceId]
    : [];

  const duplicateGroupsSql = `
    SELECT inventoryId, inventoryItemReferenceType, inventoryItemReferenceId, MIN(inventoryItemId) AS keepId
    FROM InventoryItems
    WHERE inventoryId = ? AND inventoryItemDeletedAt IS NULL ${scopeClause}
    GROUP BY inventoryId, inventoryItemReferenceType, inventoryItemReferenceId
    HAVING COUNT(*) > 1
  `;

  // 1. Re-point movement history from the duplicate rows onto the surviving row
  await pool.execute(
    `UPDATE InventoryItemMovements iim
     JOIN InventoryItems ii ON ii.inventoryItemId = iim.inventoryItemId
     JOIN (${duplicateGroupsSql}) g
       ON ii.inventoryId = g.inventoryId
      AND ii.inventoryItemReferenceType = g.inventoryItemReferenceType
      AND ii.inventoryItemReferenceId = g.inventoryItemReferenceId
      AND ii.inventoryItemId != g.keepId
     SET iim.inventoryItemId = g.keepId`,
    [inventoryId, ...scopeParams],
  );

  // 2. Merge quantities from every row in the group onto the surviving row
  await pool.execute(
    `UPDATE InventoryItems ii
     JOIN (
       SELECT inventoryId, inventoryItemReferenceType, inventoryItemReferenceId,
              MIN(inventoryItemId) AS keepId, SUM(inventoryItemQuantity) AS totalQty
       FROM InventoryItems
       WHERE inventoryId = ? AND inventoryItemDeletedAt IS NULL ${scopeClause}
       GROUP BY inventoryId, inventoryItemReferenceType, inventoryItemReferenceId
       HAVING COUNT(*) > 1
     ) g ON ii.inventoryItemId = g.keepId
     SET ii.inventoryItemQuantity = g.totalQty`,
    [inventoryId, ...scopeParams],
  );

  // 3. Soft-delete the extra rows, leaving only the surviving row active
  const [deleteResult] = await pool.execute<ResultSetHeader>(
    `UPDATE InventoryItems ii
     JOIN (${duplicateGroupsSql}) g
       ON ii.inventoryId = g.inventoryId
      AND ii.inventoryItemReferenceType = g.inventoryItemReferenceType
      AND ii.inventoryItemReferenceId = g.inventoryItemReferenceId
      AND ii.inventoryItemId != g.keepId
     SET ii.inventoryItemDeletedAt = NOW()`,
    [inventoryId, ...scopeParams],
  );

  return { removedRows: deleteResult.affectedRows };
};

export const insertItemFromAnother = async ({
  targetId,
  sourceId,
  connection,
  userId,
}: {
  targetId: number;
  sourceId: number;
  connection?: PoolConnection;
  userId: number;
}) => {
  const pool = connection ?? (await getDBConnection());

  const sql = `
    INSERT INTO InventoryItems (
      inventoryId,
      inventoryItemReferenceType,
      inventoryItemReferenceId,
      inventoryItemMin,
      inventoryItemQuantity,
      inventoryItemCreatedBy
    )
    SELECT
      ?,
      source.inventoryItemReferenceType,
      source.inventoryItemReferenceId,
      0,
      0,
      ?
    FROM InventoryItems source
    WHERE source.inventoryId = ?
      AND source.inventoryItemDeletedAt IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM InventoryItems target
        WHERE target.inventoryId = ?
          AND target.inventoryItemReferenceType =
              source.inventoryItemReferenceType
          AND target.inventoryItemReferenceId =
              source.inventoryItemReferenceId
          AND target.inventoryItemDeletedAt IS NULL
      )
  `;

  const [results] = await pool.execute(sql, [
    targetId,
    userId,
    sourceId,
    targetId,
  ]);
  return results;
};
