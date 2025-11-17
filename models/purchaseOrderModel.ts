import {
  CreatePurchaseOrderDto,
  CreatePurchaseOrderItemDto,
  CreatePurchaseOrderRequestDto,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import {
  PurchaseOrderItems,
  PurchaseOrders,
  PurchaseOrderStatus,
} from "@/types/purchaseOrders";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertPurchaseOrder = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreatePurchaseOrderDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO PurchaseOrders(poNumber,poDescription,poCreatedBy)
                VALUES(?,?,?)`;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.poNumber,
    data.poDescription,
    data.poCreatedBy,
  ]);
  return results.insertId;
};

export const insertPurchaseOrderRequest = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreatePurchaseOrderRequestDto[];
}) => {
  const pool = connection ? connection : await getDBConnection();
  if (!data.length) return 0;

  const sql = `
    INSERT INTO PurchaseOrderRequest (poId, requestId)
    VALUES ${data.map(() => "(?, ?)").join(",")}
  `;
  const values = data.flatMap((item) => [item.poId, item.requestId]);
  const [results] = await pool.execute<ResultSetHeader>(sql, values);
  return results.insertId;
};

export const insertPurchaseOrderItems = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreatePurchaseOrderItemDto[];
}) => {
  const pool = connection ? connection : await getDBConnection();
  if (!data.length) return 0;
  const sql = `INSERT INTO PurchaseOrderItems(poId,itemId,unitPrice,poItemOrderedQty)
                VALUES ${data.map(() => "(?, ?,?,?)").join(",")}`;
  const values = data.flatMap((item) => [
    item.poId,
    item.itemId,
    item.unitPrice,
    item.poItemOrderedQty,
  ]);
  const [results] = await pool.execute<ResultSetHeader>(sql, values);
  return results.insertId;
};

export const selectCountPurchaseOrder = async ({
  connection,
}: {
  connection: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT COUNT(*) as total FROM PurchaseOrders`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql);
  return rows[0];
};

export const selectPurchaseOrder = async ({
  connection,
  poNumber,
}: {
  connection?: PoolConnection;
  poNumber?: string;
}) => {
  const whereClauses: string[] = [];
  const values: any[] = [];
  const pool = connection ? connection : await getDBConnection();
  if (poNumber) {
    whereClauses.push(`poNumber = ?`);
    values.push(poNumber);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const sql = `SELECT 
  po.*,
  CONCAT_WS(' ', u.userFname, u.userLname) AS poCreatedByName,
  COALESCE(
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'poReqId', por.poReqId,
        'poId', por.poId,
        'requestId', por.requestId,
        'requestNo', ro.requestNo
      )
    ),
    JSON_ARRAY()
  ) AS purchaseOrderRequest
FROM PurchaseOrders po
LEFT JOIN PurchaseOrderRequest por ON por.poId = po.poId
LEFT JOIN RequestOrders ro ON ro.requestId = por.requestId
LEFT JOIN Users u ON u.userId = po.poCreatedBy ${whereSQL} GROUP BY po.poId;`;
  const [rows] = await pool.execute(sql, values);
  return rows;
};

export const selectPurchaseOrderItems = async ({
  connection,
  poId,
}: {
  connection?: PoolConnection;
  poId?: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let whereClauses: string[] = [];
  let values: any[] = [];
  if (poId) {
    whereClauses.push("poi.poId = ?");
    values.push(poId);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT 
  poi.*,
  i.itemName,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'suppId', s.suppId,
        'suppName', s.suppName,
        'suppItemPrice', si.suppItemPrice,
        'suppItemCreatedBy', si.suppItemCreatedBy
      )
    )
    FROM SupplierItems si
    LEFT JOIN Suppliers s ON s.suppId = si.suppId
    WHERE si.itemId = poi.itemId
  ) AS suppliers
FROM PurchaseOrderItems poi
LEFT JOIN Items i ON i.itemId = poi.itemId ${whereSQL} `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, values);
  return rows;
};

export const updatePurchaseOrder = async ({
  connection,
  updates,
  keyFields = ["poId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<UpdatePurchaseOrdersDto>[];
  keyFields?: (keyof UpdatePurchaseOrdersDto)[]; // which fields define the WHERE condition
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  // ✅ Determine all updatable fields (exclude keys)
  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof UpdatePurchaseOrdersDto)
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // ✅ Build CASE WHEN for each update field
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      // Build WHERE condition for each key (e.g., poItemId, itemId)
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add all key values + field value to params
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    setClauses.push(`${field} = CASE ${caseParts.join(" ")} END`);
  }

  // ✅ WHERE clause (unique combination of all key values)
  const whereConditions: string[] = [];
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k])
  );

  // Create `WHERE (key1, key2) IN ((?, ?), (?, ?))` if multiple keys
  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  // Push all key values again for WHERE condition
  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
      UPDATE PurchaseOrders
      SET ${setClauses.join(", ")}
      WHERE ${whereSql};
    `;
  const [result] = await pool.execute(sql, params);
  return result;
};

export const updatePOItems = async ({
  connection,
  updates,
  keyFields = ["poItemId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<PurchaseOrderItems>[];
  keyFields?: (keyof PurchaseOrderItems)[]; // which fields define the WHERE condition
}) => {
  console.log("Updates: ", updates);
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  // ✅ Determine all updatable fields (exclude keys)
  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof PurchaseOrderItems)
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // ✅ Build CASE WHEN for each update field
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      // Build WHERE condition for each key (e.g., poItemId, itemId)
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add all key values + field value to params
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    setClauses.push(`${field} = CASE ${caseParts.join(" ")} END`);
  }

  // ✅ WHERE clause (unique combination of all key values)
  const whereConditions: string[] = [];
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k])
  );

  // Create `WHERE (key1, key2) IN ((?, ?), (?, ?))` if multiple keys
  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  // Push all key values again for WHERE condition
  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE PurchaseOrderItems
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);
  return result;
};

export const selectPurchaseOrderItemsSupplier = async (poId: number) => {
  const pool = await getDBConnection();
  const sql = `SELECT 
                poi.*,
                (poi.poItemOrderedQty * poi.unitPrice) totalPrice,
                s.*, 
                i.itemName,
                i.itemUnit
              FROM PurchaseOrderItems poi
              LEFT JOIN Suppliers s ON s.suppId = poi.suppId
              LEFT JOIN Items i ON i.itemId = poi.itemId WHERE poi.poId = ?`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [poId]);
  return rows;
};

export const selectStoreItemsBySupplierAndPOId = async ({
  suppId,
  poId,
}: {
  poId: number;
  suppId: number;
}) => {
  const pool = await getDBConnection();
  const sql = `
SELECT   
    s.storeId,
    s.storeName,
    ro.requestId,
    COUNT(DISTINCT ri.reqItemId) AS requestCount,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'itemName', i.itemName,
                    'itemUnit', i.itemUnit,
                    'reqItemId', ris.reqItemId,
                    'categoryName', c.categoryName,
                    'categoryType', c.categoryType,
                    'reqItemQuantity', ris.reqItemQuantity,
                    'reqItemStatus', ris.reqItemStatus,
                    'reqItemRemarks', ris.reqItemRemarks,
                    'poItemId', poi.poItemId
                )
            ) 
            FROM RequestItems ris
            LEFT JOIN InventoryItems ii ON ii.inventoryItemId = ris.invItem
            LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId 
                AND ii.inventoryItemReferenceType = "item"
            LEFT JOIN Categories c ON c.categoryId = i.categoryId
            LEFT JOIN PurchaseOrderItems poi ON poi.itemId = i.itemId 
                AND poi.poId = ?  -- Add this condition to avoid cross-join
            WHERE ris.requestId = ro.requestId
            GROUP BY ris.reqItemId  -- This prevents duplicates
        ),
        JSON_ARRAY()
    ) AS items 
FROM Stores s
INNER JOIN RequestOrders ro ON ro.storeId = s.storeId
LEFT JOIN RequestItems ri ON ri.requestId = ro.requestId
INNER JOIN PurchaseOrderRequest por ON por.requestId = ro.requestId
INNER JOIN PurchaseOrders po ON po.poId = por.poId
WHERE po.poId = ?
GROUP BY s.storeId, s.storeName, ro.requestId;
`;
  const [rows] = await pool.execute(sql, [poId, poId]);
  return rows;
};
