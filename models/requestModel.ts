import {
  CreateRequestDto,
  CreateRequestItemDto,
  InsertItemsRequestDto,
} from "@/dtos/request.dto";
import { getDBConnection } from "@/lib/db";
import { Request, RequestItems, RequestStatus } from "@/types/request";
import { sq } from "date-fns/locale";
import {
  PoolConnection,
  QueryResult,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

export const insertRequest = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateRequestDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO RequestOrders(requestNo,storeId,requestById) VALUES(?,?,?)`;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.requestNo,
    data.storeId,
    data.requestById,
  ]);
  return results.insertId;
};

export const selectCountRequest = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Request>;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];
  let sql = `SELECT COUNT(*) as total FROM RequestOrders ro WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ro.${key} IS NULL`;
    } else {
      sql += ` AND ro.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows[0];
};

export const insertRequestItemsBulk = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateRequestItemDto[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }
  const pool = connection ? connection : await getDBConnection();

  const sql = `INSERT INTO RequestItems(requestId,invItem,reqItemQuantity,reqItemStatus,unitPrice) 
            VALUES ${data.map(() => "(?, ?, ?,?,?)").join(", ")}`;
  const values = data.flatMap((item) => [
    item.requestId,
    item.invItem,
    item.reqItemQuantity,
    item.reqItemStatus || "pending",
    item.unitPrice || 0,
  ]);
  const [results] = await pool.execute(sql, values);
  return results;
};

export const selectRequestOrders = async ({
  storeId,
  from,
  to,
  search,
  store,
}: {
  storeId?: number;
  from?: string;
  to?: string;
  search?: string;
  store?: string;
}) => {
  const pool = await getDBConnection();
  const whereClauses: string[] = [];
  const values: any[] = [];
  if (storeId !== null && storeId !== undefined) {
    whereClauses.push("ro.storeId = ?");
    values.push(storeId);
  }

  if (store) {
    whereClauses.push("s.storeName LIKE ?");
    values.push(`%${store}%`);
  }
  if (from && to) {
    whereClauses.push("DATE(ro.requestCreatedAt) BETWEEN ? AND ?");
    values.push(from);
    values.push(to);
  }
  if (search) {
    whereClauses.push("(ro.requestNo LIKE ?)");
    values.push(`%${search}%`);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT 
    ro.*,
    COUNT(ri.reqItemId) AS totalItems,
    CONCAT_WS('', u.userFname, u.userLname) AS requestedByName,
    s.storeName,
(
        SELECT SUM(
            CASE 
                WHEN ro.requestStatus = 'delivered' THEN ri.reqItemTransfer * ri.unitPrice
                WHEN ro.requestStatus = 'received' OR ro.requestStatus = 'completed'  THEN ri.reqItemReceived * ri.unitPrice
                 WHEN ro.requestStatus = 'in_progress' OR ro.requestStatus = 'delivered'  THEN ri.reqItemReceived * ri.unitPrice
                ELSE ri.reqItemQuantity * ri.unitPrice
            END
        )
        FROM RequestItems ri
        LEFT JOIN InventoryItems ii ON ii.inventoryItemId = ri.invItem
        LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId
        WHERE ri.requestId = ro.requestId
    ) AS totalCost
FROM RequestOrders ro
LEFT JOIN RequestItems ri ON ri.requestId = ro.requestId
LEFT JOIN Users u ON u.userId = ro.requestById
LEFT JOIN Stores s ON s.storeId = ro.storeId ${whereSQL}
GROUP BY ro.requestId
ORDER BY 
    CASE ro.requestStatus
        WHEN 'pending' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'delivered' THEN 3
        WHEN 'received' THEN 4
        ELSE 5
    END,
    ro.requestCreatedAt DESC;`;
  const [rows] = await pool.execute(sql, values);

  return rows;
};

export const selectRequestItems = async ({
  requestId,
  connection,
}: {
  connection?: PoolConnection;
  requestId?: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const whereClauses: string[] = [];
  const values: any[] = [];
  if (requestId) {
    whereClauses.push("ri.requestId = ?");
    values.push(requestId);
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT ri.requestId,ri.reqItemId, i.itemName,i.itemUnit,i.itemPrice,ri.reqItemId,ri.reqItemQuantity,i.itemId,
  ri.reqItemReceived,ri.reqItemRemarks,ri.reqItemTransfer,ri.reqItemToFollow, ri.invItem,ri.unitPrice, ri.reqItemStatus, ii.inventoryItemReferenceId,ii.inventoryId FROM RequestItems ri
  LEFT JOIN InventoryItems ii ON ii.inventoryItemId = ri.invItem
  LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId ${whereSQL}`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, values);
  return rows;
};

export const selectRequestItemsById = async ({
  requestId,
  itemId,
}: {
  requestId?: number;
  itemId?: number;
}) => {
  const pool = await getDBConnection();
  const whereClauses: string[] = [];
  const values: any[] = [];
  if (requestId) {
    whereClauses.push("ri.requestId = ?");
    values.push(requestId);
  }
  if (itemId) {
    whereClauses.push(
      "ii.inventoryItemReferenceId = ? AND ii.inventoryItemReferenceType = 'item'",
    );
    values.push(itemId);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM RequestItems ri 
  LEFT JOIN InventoryItems ii ON ii.inventoryItemId = ri.invItem
  ${whereSQL}`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, values);
  return rows;
};

export const selectRequestItemsByIds = async ({
  requestIds,
}: {
  requestIds?: number[];
}) => {
  const pool = await getDBConnection();

  if (!requestIds || requestIds.length === 0) {
    return [];
  }

  // Step 1: Get stores involved for those requestIds
  const placeholders = requestIds.map(() => "?").join(", ");
  const [storeRows] = await pool.execute<RowDataPacket[]>(
    `
    SELECT DISTINCT s.storeId, s.storeName
    FROM RequestOrders ro
    INNER JOIN Stores s ON s.storeId = ro.storeId
    WHERE ro.requestId IN (${placeholders})
    `,
    requestIds,
  );

  if (storeRows.length === 0) {
    return [];
  }

  // Step 2: Build dynamic pivot columns
  const storeColumns = storeRows
    .map(
      (store: any) => `
        SUM(CASE WHEN ro.storeId = ${
          store.storeId
        } THEN ri.reqItemQuantity ELSE 0 END) AS \`${store.storeName.replace(
          /\s+/g,
          "_",
        )}_Qty\`
      `,
    )
    .join(", ");

  // Step 3: Build main SQL query dynamically

  const sql = `
SELECT 
  i.itemId,
  i.itemName,
  i.itemUnit,
  i.itemPrice,
  COALESCE((
	   SELECT DISTINCT 
	  iis.inventoryItemQuantity 
	FROM InventoryItems iis
	LEFT JOIN Inventories its ON its.inventoryId = iis.inventoryId
	LEFT JOIN StockRooms sr ON sr.stockRoomId = its.inventoryReferenceId AND its.inventoryReference = 'stock-room'
	LEFT JOIN StockStores ss ON ss.stockRoomId = sr.stockRoomId
	LEFT JOIN RequestOrders ro ON ro.storeId = ss.storeId
	WHERE ro.requestId IN (${placeholders}) AND iis.inventoryItemReferenceId = i.itemId
  ), 0) AS stockItem,
   ${storeColumns},
  SUM(ri.reqItemQuantity) AS totalQuantity,
  SUM(ri.reqItemReceived) AS totalReceived
FROM RequestItems ri
INNER JOIN RequestOrders ro ON ro.requestId = ri.requestId
INNER JOIN InventoryItems ii ON ii.inventoryItemId = ri.invItem
INNER JOIN Items i ON i.itemId = ii.inventoryItemReferenceId
    WHERE ri.requestId IN (${placeholders})
    GROUP BY 
      i.itemId,
      i.itemName,
      i.itemUnit,
      i.itemPrice
    ORDER BY i.itemName;
  `;
  // Step 4: Execute final query

  const values = [...requestIds, ...requestIds];
  const [rows] = await pool.execute(sql, values);
  return rows;
};

export const updateRequest = async ({
  connection,
  updates,
  keyFields = ["requestId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<Request>[];
  keyFields?: (keyof Request)[]; // which fields define the WHERE condition
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  // ✅ Determine all updatable fields (exclude keys)
  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof Request),
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
    keyFields.map((k) => (row as any)[k]),
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
    UPDATE RequestOrders
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  const [result] = await pool.execute(sql, params);
  return result;
};

export const selectRequestOrdersByPONumber = async (poNumber: string) => {
  const pool = await getDBConnection();
  const sql = `     SELECT 
  ro.*,
  po.*,
  s.*,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'itemName', i.itemName,
        'itemId',i.itemId,
        'itemPrice', i.itemPrice,
        'itemUnit', i.itemUnit,
        'inventoryItemQuantity', ii.inventoryItemQuantity,
        'reqItemId', ri.reqItemId,
        'requestId', ri.requestId,
        'invItem', ri.invItem,
        'unitPrice', ri.unitPrice,
        'reqItemRemarks', ri.reqItemRemarks,
        'reqItemQuantity', ri.reqItemQuantity,
        'reqItemTransfer', ri.reqItemTransfer,
         'reqItemReceived', ri.reqItemReceived,
        'reqItemStatus', ri.reqItemStatus,
        'reqItemToFollow',ri.reqItemToFollow,
        'stockRoomQty', (
          SELECT iis.inventoryItemQuantity
          FROM InventoryItems iis
         LEFT JOIN Inventories ity ON ity.inventoryId = iis.inventoryId
         LEFT JOIN StockRooms sr ON sr.stockRoomId = ity.inventoryReferenceId AND ity.inventoryReference = "stock-room"
         LEFT JOIN StockPurchasers sp ON sp.stockRoomId = sr.stockRoomId 
          WHERE iis.inventoryItemReferenceId = ii.inventoryItemReferenceId
            AND sp.userId = po.poCreatedBy
          LIMIT 1
        )
      )
    )
    FROM RequestItems ri
    LEFT JOIN InventoryItems ii 
      ON ii.inventoryItemId = ri.invItem
    LEFT JOIN Items i 
      ON i.itemId = ii.inventoryItemReferenceId
    WHERE ri.requestId = ro.requestId
  ) AS requestItemsData
FROM RequestOrders ro
LEFT JOIN Stores s ON s.storeId = ro.storeId 
LEFT JOIN PurchaseOrderRequest por 
  ON por.requestId = ro.requestId
LEFT JOIN PurchaseOrders po 
  ON po.poId = por.poId
WHERE po.poNumber = ?`;
  const [rows] = await pool.execute(sql, [poNumber]);
  return rows;
};

export const updateRequestItem = async ({
  connection,
  updates,
  keyFields = ["reqItemId"],
}: {
  connection?: PoolConnection;
  updates: Partial<RequestItems>[];
  keyFields?: (keyof RequestItems)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  // ✅ Determine all updatable fields (exclude keys)
  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof RequestItems),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  // Batch updates individually to avoid lock wait timeout
  for (const row of updates) {
    const setClauses: string[] = [];
    const params: any[] = [];

    for (const field of updateFields) {
      setClauses.push(`${field} = ?`);
      params.push((row as any)[field]);
    }

    const whereClauses = keyFields.map((k) => {
      params.push((row as any)[k]);
      return `${k} = ?`;
    });

    const sql = `UPDATE RequestItems SET ${setClauses.join(
      ", ",
    )} WHERE ${whereClauses.join(" AND ")}`;

    await pool.execute(sql, params);
  }
};

export const selectRequestOrderItems = async ({
  connection,
  requestNo,
}: {
  connection?: PoolConnection;
  requestNo: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let whereClauses: string[] = [];
  let values: any[] = [];

  if (requestNo) {
    whereClauses.push("ro.requestNo = ?");
    values.push(requestNo);
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT ro.*,(
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'itemName', i.itemName,
        'itemPrice', i.itemPrice,
        'itemUnit', i.itemUnit,
        'inventoryItemQuantity', ii.inventoryItemQuantity,
        'reqItemId', ri.reqItemId,
        'requestId', ri.requestId,
        'invItem', ri.invItem,
        'reqItemRemarks', ri.reqItemRemarks,
        'reqItemQuantity', ri.reqItemQuantity,
        'reqItemTransfer', ri.reqItemTransfer,
        'reqItemRemarks', ri.reqItemRemarks
      )
    )
    FROM RequestItems ri
    LEFT JOIN InventoryItems ii 
      ON ii.inventoryItemId = ri.invItem
    LEFT JOIN Items i 
      ON i.itemId = ii.inventoryItemReferenceId
    WHERE ri.requestId = ro.requestId
  ) AS requestItems
   FROM RequestOrders ro ${whereSQL}`;
  const [rows] = await pool.execute(sql, values);
  return rows;
};

export const selectRequetItemsByPOId = async ({
  connection,
  poItemId,
}: {
  connection: PoolConnection;
  poItemId: number[];
}) => {
  // Create placeholders for each item in the array
  const placeholders = poItemId.map(() => "?").join(",");

  const sql = `SELECT * FROM RequestItems ri
LEFT JOIN InventoryItems ii ON ii.inventoryItemId = ri.invItem
LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId
LEFT JOIN PurchaseOrderItems poi ON poi.itemId = i.itemId
WHERE poi.poItemId IN (${placeholders})`;

  const [rows] = await connection.execute<RowDataPacket[]>(sql, poItemId);
  return rows;
};

export const selectRequetItemsByPOItemIdWithConversion = async ({
  connection,
  poItemId,
}: {
  connection: PoolConnection;
  poItemId: number;
}) => {
  // Create placeholders for each item in the array
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT 
    ri.*,
    ic.*,
    ii.inventoryItemReferenceId
FROM PurchaseOrderItems poi

LEFT JOIN PurchaseOrderRequest por 
    ON por.poId = poi.poId

-- Direct inventory match
LEFT JOIN InventoryItems ii 
    ON ii.inventoryItemReferenceId = poi.itemId

LEFT JOIN RequestItems ri 
    ON ri.requestId = por.requestId 
    AND ri.invItem = ii.inventoryItemId

-- 🔥 Only attempt conversion if NO direct match
LEFT JOIN ItemConversions ic 
    ON ri.reqItemId IS NULL
    AND (
        ic.fromItemId = ii.inventoryItemReferenceId
        OR ic.toItemId = ii.inventoryItemReferenceId
    )

LEFT JOIN Items i 
    ON i.itemId = ii.inventoryItemReferenceId

WHERE poi.poItemId = ?
  AND ri.reqItemId IS NOT NULL`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [poItemId]);
  return rows;
};

export const selectRequestOrderFromStockRoom = async (userId: number) => {
  const pool = await getDBConnection();
  const sql = `SELECT 
    ro.*,
    s.*,
    CONCAT_WS(' ', u.userFname, u.userLname) AS requestedByName
FROM RequestOrders ro
LEFT JOIN Stores s ON s.storeId = ro.storeId
LEFT JOIN Users u ON u.userId = ro.requestById
WHERE ro.storeId IN (
    SELECT s.storeId 
    FROM StockPurchasers sp 
    INNER JOIN StockRooms sr ON sr.stockRoomId = sp.stockRoomId
    INNER JOIN StockStores ss ON ss.stockRoomId = sr.stockRoomId
    INNER JOIN Stores s ON s.storeId = ss.storeId
    WHERE sp.userId = ?
) 
ORDER BY 
    CASE ro.requestStatus 
        WHEN 'pending' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'delivered' THEN 3
        WHEN 'received' THEN 4
        ELSE 5
    END ASC,
    ro.requestCreatedAt DESC;`;
  const [rows] = await pool.execute(sql, [userId]);
  return rows;
};

export const selectRequestItemsByPOId = async ({
  connection,
  poId,
}: {
  connection?: PoolConnection;
  poId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT DISTINCT ri.* 
FROM PurchaseOrderItems poi 
LEFT JOIN PurchaseOrderRequest por ON por.poId = poi.poId
LEFT JOIN RequestOrders ro ON ro.requestId = por.requestId
LEFT JOIN RequestItems ri ON ri.requestId = ro.requestId
WHERE poi.poId = ?;`;

  const [rows] = await pool.execute(sql, [poId]);
  return rows as RequestItems[];
};
