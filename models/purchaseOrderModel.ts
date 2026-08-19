import {
  RequestItemWithPOItem,
  StoreSupplierDetails,
} from "@/app/purchase-orders/components/ApprovedPOView";
import {
  CreatePurchaseOrderDto,
  CreatePurchaseOrderItemDto,
  CreatePurchaseOrderRequestDto,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { assertKnownColumns } from "@/lib/db/assertKnownColumns";
import {
  PurchaseOrderItems,
  PurchaseOrderRequest,
  PurchaseOrders,
  PurchaseOrderStatus,
} from "@/types/purchaseOrders";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Column names are interpolated directly into raw SQL below (CASE/WHERE
// builders) - allowlisting against the real PurchaseOrderItems columns
// prevents a crafted request body (e.g. an extra key on a Partial<...>-typed
// JSON body) from injecting arbitrary SQL via an object key.
const PURCHASE_ORDER_ITEMS_COLUMNS = new Set<keyof PurchaseOrderItems>([
  "poItemId",
  "poId",
  "itemId",
  "unitPrice",
  "poItemOrderedQty",
  "poItemReceivedQty",
  "suppId",
  "poItemStatus",
]);

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
  connection?: PoolConnection;
  data: CreatePurchaseOrderItemDto[];
}) => {
  const pool = connection ? connection : await getDBConnection();

  if (!data.length) return 0;
  const sql = `INSERT INTO PurchaseOrderItems(poId,itemId,unitPrice,poItemOrderedQty,poItemStatus,suppId)
                VALUES ${data.map(() => "(?, ?,?,?,?,?)").join(",")}`;
  const values = data.flatMap((item) => [
    item.poId,
    item.itemId,
    item.unitPrice,
    item.poItemOrderedQty,
    item.poItemStatus || "pending",
    item.suppId || null,
  ]);
  const [results] = await pool.execute<ResultSetHeader>(sql, values);

  const count = results.affectedRows;
  const firstId = results.insertId;
  const insertedIds = Array.from({ length: count }, (_, i) => firstId + i);

  return insertedIds;
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
LEFT JOIN Users u ON u.userId = po.poCreatedBy ${whereSQL} GROUP BY po.poId ORDER BY 
CASE po.poStatus
	WHEN  "pending" THEN 1
	WHEN  "approved" THEN 2
	WHEN  "sent" THEN 3
	WHEN  "received" THEN 4
	ELSE 5
	END ASC,
po.poCreatedAt DESC;`;
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
    whereClauses.length > 0
      ? `WHERE poi.poItemStatus != 'removed' AND ${whereClauses.join(" AND ")}`
      : "";
  const sql = `SELECT 
  poi.*,
  i.itemName,
  i.itemUnit,
  	  (
	      SELECT JSON_ARRAYAGG(
	        JSON_OBJECT(
	          'ordComItemId', oc.ordComItemId,
	          'itemId', oc.itemId,
	          'poItemId', oc.poItemId,
	          'reqItemId', oc.reqItemId,
	          'itemName', i.itemName,
	          'ordComPrice', oc.ordComPrice,
	          'itemUnit', i.itemUnit,
            'ordComQuantity', oc.ordComQuantity
	        )
	      )
	      FROM OrderCompositeItem oc
			LEFT JOIN PurchaseOrderItems pois ON oc.poItemId = pois.poItemId
			LEFT JOIN Items i ON i.itemId = oc.itemId
			WHERE oc.poItemId =  poi.poItemId
	    ) AS composite,
  COALESCE(
    (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'suppId', s.suppId,
          'suppItemId', si.suppItemId,
          'suppName', s.suppName,
          'suppItemPrice', si.suppItemPrice,
          'suppItemCreatedBy', si.suppItemCreatedBy
        )
      )
      FROM SupplierItems si
      INNER JOIN Suppliers s ON s.suppId = si.suppId
      WHERE si.itemId = poi.itemId AND si.suppItemStatus != 'deleted'
    ), JSON_ARRAY()
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
    (field) => !keyFields.includes(field as keyof UpdatePurchaseOrdersDto),
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
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  assertKnownColumns(keyFields, PURCHASE_ORDER_ITEMS_COLUMNS, "PurchaseOrderItems");
  assertKnownColumns(
    Object.keys(updates[0]),
    PURCHASE_ORDER_ITEMS_COLUMNS,
    "PurchaseOrderItems",
  );

  // ✅ Determine all updatable fields (exclude keys)
  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof PurchaseOrderItems),
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
                i.itemUnit,
		         (
			      SELECT JSON_ARRAYAGG(
			        JSON_OBJECT(
			          'ordComItemId', oc.ordComItemId,
			          'itemId', oc.itemId,
			          'poItemId', oc.poItemId,
			          'reqItemId', oc.reqItemId,
			          'itemName', i.itemName,
			          'ordComPrice', oc.ordComPrice,
			          'itemUnit', i.itemUnit,
                'ordComQuantity', oc.ordComQuantity
			        )
			      )
			      FROM OrderCompositeItem oc
					LEFT JOIN PurchaseOrderItems pois ON oc.poItemId = pois.poItemId
					LEFT JOIN Items i ON i.itemId = oc.itemId
					WHERE oc.poItemId =  poi.poItemId
			    ) AS composite
              FROM PurchaseOrderItems poi
              LEFT JOIN Suppliers s ON s.suppId = poi.suppId
              LEFT JOIN Items i ON i.itemId = poi.itemId WHERE poi.poId = ? AND poi.poItemStatus != 'removed'`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [poId]);
  return rows;
};

export const selectStoreItemsBySupplierAndPOId = async ({
  connection,
  suppId,
  poId,
}: {
  connection?: PoolConnection;
  poId: number;
  suppId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `
SELECT 
    s.storeId,
    s.storeName,
    ro.requestId,
    COUNT(DISTINCT ri.reqItemId) AS totalRequestCount,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'itemName', i.itemName,
                    'itemPrice', i.itemPrice,
                    'itemUnit', i.itemUnit,
                    'reqItemId', ri.reqItemId,
                    'categoryName', c.categoryName,
                    'categoryType', c.categoryType,
                    'reqItemQuantity', ri.reqItemQuantity,
                    'reqItemStatus', ri.reqItemStatus,
                    'reqItemRemarks', ri.reqItemRemarks,
                    'poItemId', poi.poItemId,
                    'suppId', poi.suppId
                )
            )
            FROM PurchaseOrderItems poi
            LEFT JOIN PurchaseOrderRequest por ON por.poId = poi.poId
            LEFT JOIN RequestOrders ro_sub ON ro_sub.requestId = por.requestId
            LEFT JOIN RequestItems ri ON ri.requestId = ro_sub.requestId
            LEFT JOIN InventoryItems ii ON ii.inventoryItemId = ri.invItem
            LEFT JOIN Items i ON i.itemId = poi.itemId 
                AND poi.itemId = ii.inventoryItemReferenceId 
                AND ii.inventoryItemReferenceType = 'item'
            LEFT JOIN Categories c ON c.categoryId = i.categoryId
            WHERE poi.poId = ?
                AND poi.suppId = ?
                AND i.itemId IS NOT NULL
                AND ro_sub.requestId = ro.requestId  -- Correlate with main query
        ),
        JSON_ARRAY()
    ) AS items
FROM Stores s
INNER JOIN RequestOrders ro ON ro.storeId = s.storeId
INNER JOIN PurchaseOrderRequest por ON por.requestId = ro.requestId
INNER JOIN PurchaseOrders po ON po.poId = por.poId
LEFT JOIN RequestItems ri ON ri.requestId = ro.requestId
WHERE po.poId = ?
GROUP BY s.storeId, s.storeName, ro.requestId;
`;
  const [rows] = await pool.execute(sql, [poId, suppId, poId]);
  return rows as StoreSupplierDetails[];
};

export const selectStoreItemsBySupplierAndPOIdConversion = async ({
  connection,
  suppId,
  poId,
}: {
  connection?: PoolConnection;
  poId: number;
  suppId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT
    i.itemId,
    i.itemName,
    i.itemUnit,
    i.itemPrice,
    GROUP_CONCAT(DISTINCT ri.reqItemId) AS reqItemId,
    GROUP_CONCAT(DISTINCT ri.reqItemQuantity) AS reqItemQuantity,
    GROUP_CONCAT(DISTINCT ri.reqItemStatus) AS reqItemStatus,
    GROUP_CONCAT(DISTINCT ri.reqItemRemarks) AS reqItemRemarks,
    i.itemPrice,
    poi.poItemId,
    poi.suppId,
    c.categoryName,
    c.categoryType,
    ic.toItemId,
    ro.storeId
FROM PurchaseOrderItems poi
LEFT JOIN PurchaseOrderRequest por 
       ON por.poId = poi.poId
LEFT JOIN ItemConversions ic
       ON ic.fromItemId = poi.itemId  -- only take conversion if PO item is the "fromItem"
LEFT JOIN Items i
       ON i.itemId = COALESCE(ic.toItemId, poi.itemId)  -- take toItemId if conversion exists
LEFT JOIN Categories c
       ON c.categoryId = i.categoryId
LEFT JOIN InventoryItems ii
       ON ii.inventoryItemReferenceId = i.itemId  -- link inventory to final item
LEFT JOIN RequestItems ri
       ON ri.invItem = ii.inventoryItemId AND ri.requestId = por.requestId
LEFT JOIN RequestOrders ro ON ro.requestId = por.requestId
WHERE poi.poId = ? AND poi.suppId = ? AND ri.reqItemId IS NOT NULL
GROUP BY i.itemId,i.itemPrice, i.itemName, i.itemUnit, poi.poItemId, poi.suppId, c.categoryName, c.categoryType, ic.toItemId,ro.storeId,i.itemPrice;`;
  const [rows] = await pool.execute(sql, [poId, suppId]);
  return rows as RequestItemWithPOItem[];
};

export const selectPurchaserOrderItems = async ({
  connection,
  keyfields = {},
}: {
  connection?: PoolConnection;
  keyfields: Partial<PurchaseOrderItems>;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT * FROM PurchaseOrderItems WHERE 1=1`;

  const params: any[] = [];

  // ✅ Build WHERE dynamically
  for (const [key, value] of Object.entries(keyfields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else if (value === 0) {
      // Handle IS NOT NULL
      sql += ` AND ${key} IS NOT NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute(sql, params);
  return rows as PurchaseOrderItems[];
};

export const selectPurchaserOrderByFields = async ({
  connection,
  keyfields = {},
}: {
  connection?: PoolConnection;
  keyfields: Partial<PurchaseOrders>;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT po.*, CONCAT_WS(' ', u.userFname, u.userLname) AS poCreatedByName,
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
LEFT JOIN Users u ON u.userId = po.poCreatedBy
WHERE 1=1 `;

  const params: any[] = [];

  // ✅ Build WHERE dynamically
  for (const [key, value] of Object.entries(keyfields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else if (value === 0) {
      // Handle IS NOT NULL
      sql += ` AND ${key} IS NOT NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  sql += ` GROUP BY po.poId
ORDER BY 
CASE po.poStatus
	WHEN  "pending" THEN 1
	WHEN  "approved" THEN 2
	WHEN  "sent" THEN 3
	WHEN  "received" THEN 4
	ELSE 5
	END ASC,
po.poCreatedAt DESC`;
  const [rows] = await pool.execute(sql, params);
  return rows as PurchaseOrderItems[];
};

export const selectPObyPoOrderRequestFields = async ({
  connection,
  keyfields = {},
}: {
  connection?: PoolConnection;
  keyfields: Partial<PurchaseOrderRequest>;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = ` SELECT po.* FROM PurchaseOrders po 
  LEFT JOIN PurchaseOrderRequest por ON por.poId = po.poId
  WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyfields)) {
    if (value === null) {
      sql += ` AND por.${key} IS NULL`;
    } else if (value === 0) {
      // Handle IS NOT NULL
      sql += ` AND por.${key} IS NOT NULL`;
    } else {
      sql += ` AND por.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute(sql, params);
  return rows as PurchaseOrderItems[];
};

export const selectProcurementHistoryByPO = async () => {
  const pool = await getDBConnection();
  const sql = `SELECT 
  po.poId,
  po.poNumber,
  s.suppId,
  s.suppName,
  po.poCreatedAt,
  SUM(poi.unitPrice * poi.poItemOrderedQty) AS totalPurchase
FROM PurchaseOrders po
LEFT JOIN PurchaseOrderItems poi 
  ON poi.poId = po.poId
LEFT JOIN Suppliers s 
  ON s.suppId = poi.suppId
WHERE poi.poItemStatus = 'received' OR poi.poItemStatus = 'completed'
GROUP BY 
  po.poId,
  po.poNumber,
  s.suppId,
  s.suppName;`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql);
  return rows;
};

export const selectPurchaseOrderItemByRequesItemId = async ({
  connection,
  reqItemId,
}: {
  connection?: PoolConnection;
  reqItemId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT * FROM PurchaseOrderItems poi
    LEFT JOIN Items i ON i.itemId = poi.itemId WHERE poi.poItemId = (
    SELECT COALESCE(poi1.poItemId,poi2.poItemId,poi3.poItemId) AS poId FROM PurchaseOrderRequest por
    LEFT JOIN RequestItems ri ON ri.requestId = por.requestId
    LEFT JOIN InventoryItems ii ON ii.inventoryItemId = ri.invItem
    LEFT JOIN PurchaseOrderItems poi1 ON poi1.itemId = ii.inventoryItemReferenceId AND poi1.poId = por.poId

    LEFT JOIN ItemConversions ic1 ON ic1.toItemId = ii.inventoryItemReferenceId
    LEFT JOIN Items i1 ON  i1.itemId = ic1.fromItemId
    LEFT JOIN PurchaseOrderItems poi2 ON poi2.itemId = ic1.fromItemId AND poi2.poId = por.poId


    LEFT JOIN ItemConversions ic2 ON ic2.toItemId = ii.inventoryItemReferenceId
    LEFT JOIN Items i2 ON  i2.itemId = ic2.fromItemId
    LEFT JOIN PurchaseOrderItems poi3 ON poi3.itemId = ic2.fromItemId AND poi3.poId = por.poId

    WHERE ri.reqItemId = ? GROUP BY poid
)`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [reqItemId]);
  return rows;
};
