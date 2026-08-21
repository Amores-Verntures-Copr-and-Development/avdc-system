import { getDBConnection } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const selectPurchaserStats = async (userId: number) => {
  const pool = await getDBConnection();
  const sql = `SELECT
  (SELECT COUNT(*)
   FROM PurchaseOrders po
   WHERE po.poCreatedBy = ?
  ) AS totalPurchase,

  (SELECT 
  SUM(ii.inventoryItemQuantity * it.itemPrice) 
FROM InventoryItems ii
LEFT JOIN Items it 
  ON it.itemId = ii.inventoryItemReferenceId
 AND ii.inventoryItemReferenceType = 'item'
LEFT JOIN Inventories i 
  ON i.inventoryId = ii.inventoryId
LEFT JOIN StockRooms sr 
  ON sr.stockRoomId = i.inventoryReferenceId
 AND i.inventoryReference = 'stock-room'
LEFT JOIN StockPurchasers sp 
  ON sp.stockRoomId = sr.stockRoomId
LEFT JOIN Users u 
  ON u.userId = sp.userId
WHERE u.userId = ?
  ) AS inventoryCost,

  (SELECT COUNT(*)
   FROM InventoryItems ii
   LEFT JOIN Inventories i 
     ON i.inventoryId = ii.inventoryId
   LEFT JOIN StockRooms sr 
     ON sr.stockRoomId = i.inventoryReferenceId
    AND i.inventoryReference = 'stock-room'
   LEFT JOIN StockPurchasers sp 
     ON sp.stockRoomId = sr.stockRoomId
   WHERE sp.userId = ?
     AND ii.inventoryItemQuantity < ii.inventoryItemMin
  ) AS lowStock,

  (SELECT COUNT(*)
   FROM InventoryItems ii
   LEFT JOIN Inventories i 
     ON i.inventoryId = ii.inventoryId
   LEFT JOIN StockRooms sr 
     ON sr.stockRoomId = i.inventoryReferenceId
    AND i.inventoryReference = 'stock-room'
   LEFT JOIN StockPurchasers sp 
     ON sp.stockRoomId = sr.stockRoomId
   WHERE sp.userId = ?
     AND ii.inventoryItemQuantity = 0
  ) AS outOfStock;`;

  const [rows] = await pool.execute(sql, [userId, userId, userId, userId]);

  return rows;
};

// Backs the Purchaser Dashboard's "Low Stock Items" widget - same
// StockPurchasers -> StockRooms -> Inventories join used by the lowStock
// count in selectPurchaserStats above, so the list and the count stay
// consistent with each other.
export const selectLowStockItemsByUserId = async (
  userId: number,
  limit: number = 20,
) => {
  const pool = await getDBConnection();
  const sql = `
    SELECT
      ii.inventoryItemId,
      it.itemId,
      it.itemName,
      it.itemUnit,
      ii.inventoryItemQuantity,
      ii.inventoryItemMin,
      c.categoryName
    FROM InventoryItems ii
    LEFT JOIN Items it
      ON it.itemId = ii.inventoryItemReferenceId
     AND ii.inventoryItemReferenceType = 'item'
    LEFT JOIN Categories c
      ON c.categoryId = it.categoryId
    LEFT JOIN Inventories i
      ON i.inventoryId = ii.inventoryId
    LEFT JOIN StockRooms sr
      ON sr.stockRoomId = i.inventoryReferenceId
     AND i.inventoryReference = 'stock-room'
    LEFT JOIN StockPurchasers sp
      ON sp.stockRoomId = sr.stockRoomId
    WHERE sp.userId = ?
      AND ii.inventoryItemQuantity < ii.inventoryItemMin
    ORDER BY ii.inventoryItemQuantity ASC
    LIMIT ${Number(limit)}
  `;
  const [rows] = await pool.execute(sql, [userId]);
  return rows;
};

export const selectPendingRequestByUserId = async (userId: number) => {
  const pool = await getDBConnection();
  const sql = `
SELECT 
    ro.*,
    s.*,
    (SELECT COUNT(*) FROM RequestItems ri WHERE ri.requestId = ro.requestId) AS requestItemsCount
FROM RequestOrders ro
LEFT JOIN StockStores ss ON ro.storeId = ss.storeId  -- Fixed: was ro.storeId = ro.storeId
LEFT JOIN StockPurchasers sp ON sp.stockRoomId = ss.stockRoomId
LEFT JOIN Stores s ON s.storeId = ro.storeId
WHERE sp.userId = ? AND ro.requestStatus = 'pending';`;
  const [rows] = await pool.execute(sql, [userId]);
  return rows;
};

// storeId (single) or storeIds (a company's full store list) scope the
// three Sales-backed metrics below to one company - without either, an
// owner with no store selected would see totals blended across every
// company's sales. totalStores/totalInventoryCost/totalPurchase are left
// exactly as they were (pre-existing, already either global or scoped via
// a separate mechanism this fix doesn't touch).
export const selectOwnerDashboardStats = async ({
  storeId,
  storeIds,
}: {
  storeId?: number;
  storeIds?: number[];
}) => {
  const pool = await getDBConnection();
  const params: any[] = [];

  let salesFilterClause = "";
  let salesFilterParams: number[] = [];
  if (storeId) {
    salesFilterClause = `s.storeId = ?`;
    salesFilterParams = [storeId];
  } else if (storeIds && storeIds.length > 0) {
    salesFilterClause = `s.storeId IN (${storeIds.map(() => "?").join(",")})`;
    salesFilterParams = storeIds;
  }

  let salesPaymentsFilterClause = "";
  if (storeId) {
    salesPaymentsFilterClause = `s2.storeId = ?`;
  } else if (storeIds && storeIds.length > 0) {
    salesPaymentsFilterClause = `s2.storeId IN (${storeIds.map(() => "?").join(",")})`;
  }

  // Sales.salesTotalAmount is never decremented on refund (SalesRefunds is
  // a separate append-only ledger, same as everywhere else this is netted
  // in the app) - left un-netted here, "Total Sales" overstated actual
  // revenue by however much had been refunded.
  const sql = `SELECT
(
  SELECT COALESCE(SUM(s.salesTotalAmount) - COALESCE(SUM(sr.refundAmt), 0), 0)
  FROM Sales s
  LEFT JOIN (
    SELECT salesId, SUM(salesRefAmount) AS refundAmt
    FROM SalesRefunds
    GROUP BY salesId
  ) sr ON sr.salesId = s.salesId
  ${salesFilterClause ? `WHERE ${salesFilterClause}` : ``}
) AS totalSales,
(SELECT COUNT(*) FROM Sales s ${salesFilterClause ? `WHERE ${salesFilterClause}` : ``}) AS totalTransactions,
(SELECT COUNT(*) FROM Stores s) AS totalStores,
(SELECT SUM(ii.inventoryItemQuantity * i.itemPrice ) FROM InventoryItems ii INNER JOIN Items i ON i.itemId = ii.inventoryItemReferenceId AND  ii.inventoryItemReferenceType = 'item' ${storeId ? ` LEFT JOIN Inventories iis ON iis.inventoryId = ii.inventoryId` : ``} WHERE ii.inventoryItemDeletedAt IS NULL ${storeId ? ` AND inventoryReference = 'store' AND inventoryReferenceId = ?` : ``})
AS totalInventoryCost,
(SELECT SUM(poi.unitPrice * poi.poItemReceivedQty)  FROM PurchaseOrderItems poi WHERE poi.poItemStatus = 'received' OR poi.poItemStatus = 'delivered' OR poi.poItemStatus = 'completed') AS  totalPurchase,
(
  SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('payMetName', pmTotals.payMetName, 'totalAmount', pmTotals.totalAmount)), JSON_ARRAY())
  FROM (
    SELECT pm.payMetName AS payMetName, SUM(sp.salesPaymentAmount) AS totalAmount
    FROM SalesPayments sp
    INNER JOIN PaymentMethods pm ON pm.payMetId = sp.payMetId
    INNER JOIN Sales s2 ON s2.salesId = sp.salesId
    ${salesPaymentsFilterClause ? `WHERE ${salesPaymentsFilterClause}` : ``}
    GROUP BY pm.payMetName
    ORDER BY totalAmount DESC
  ) pmTotals
) AS paymentMethods
; `;
  params.push(...salesFilterParams, ...salesFilterParams);
  if (storeId) {
    params.push(storeId);
  }
  params.push(...salesFilterParams);
  const [rows] = await pool.execute(sql, params);
  return rows;
};

export const selectStoresRecentSales = async ({
  storeIds,
}: {
  storeIds?: number[];
} = {}) => {
  const pool = await getDBConnection();
  const hasFilter = Array.isArray(storeIds) && storeIds.length > 0;
  const sql = `SELECT
  s.storeId,
    s.storeName,
    sl.salesNo,
    COALESCE(sl.salesTotalAmount - sr.refundAmt, sl.salesTotalAmount) AS salesTotalAmount,
    (
        SELECT SUM(si.salesItemQuantity)
        FROM SalesItems si
        WHERE si.salesId = sl.salesId
    ) AS itemQty
FROM Stores s
LEFT JOIN Sales sl
    ON sl.storeId = s.storeId
    AND DATE(sl.salesCreatedAt) = CURRENT_DATE
    AND sl.salesCreatedAt = (
        SELECT MAX(sl2.salesCreatedAt)
        FROM Sales sl2
        WHERE sl2.storeId = s.storeId
          AND DATE(sl2.salesCreatedAt) = CURRENT_DATE
    )
LEFT JOIN (
    SELECT salesId, SUM(salesRefAmount) AS refundAmt
    FROM SalesRefunds
    GROUP BY salesId
) sr ON sr.salesId = sl.salesId
${hasFilter ? `WHERE s.storeId IN (${storeIds!.map(() => "?").join(",")})` : ``}
ORDER BY sl.salesCreatedAt DESC;`;

  const [rows] = await pool.execute(sql, hasFilter ? storeIds : []);
  return rows;
};

export const selectSalesChartData = async ({
  year,
  storeId,
  storeIds,
}: {
  year?: string;
  storeId?: number;
  storeIds?: number[];
}) => {
  const pool = await getDBConnection();

  let sql = `
    SELECT
      MONTH(s.salesCreatedAt) AS monthNumber,
      DATE_FORMAT(s.salesCreatedAt, '%M') AS monthName,
      COALESCE(SUM(s.salesTotalAmount) - COALESCE(SUM(sr.refundAmt), 0), 0) AS totalSales
    FROM Sales s
    LEFT JOIN (
      SELECT salesId, SUM(salesRefAmount) AS refundAmt
      FROM SalesRefunds
      GROUP BY salesId
    ) sr ON sr.salesId = s.salesId
    WHERE YEAR(s.salesCreatedAt) = ?
  `;

  const params: any[] = [year];

  if (storeId) {
    sql += ` AND s.storeId = ?`;
    params.push(storeId);
  } else if (storeIds && storeIds.length > 0) {
    sql += ` AND s.storeId IN (${storeIds.map(() => "?").join(",")})`;
    params.push(...storeIds);
  }

  sql += `
    GROUP BY MONTH(s.salesCreatedAt), DATE_FORMAT(s.salesCreatedAt, '%M')
    ORDER BY MONTH(s.salesCreatedAt);
  `;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const selectPurchaseOrderMonthlyData = async ({
  year,
}: {
  year: string;
}) => {
  const pool = await getDBConnection();
  const sql = `SELECT
    MONTH(po.poCreatedAt) AS monthNumber,
    DATE_FORMAT(po.poCreatedAt, '%M') AS monthName,
    COALESCE(SUM(poi.unitPrice * poi.poItemReceivedQty),0) AS totalPurchase
FROM PurchaseOrders po
LEFT JOIN PurchaseOrderItems poi
    ON poi.poId = po.poId
    AND poi.poItemStatus IN ('received', 'delivered', 'completed')
WHERE YEAR(po.poCreatedAt) = ?
GROUP BY MONTH(po.poCreatedAt), DATE_FORMAT(po.poCreatedAt, '%M')
ORDER BY MONTH(po.poCreatedAt);`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [year]);
  return rows;
};
