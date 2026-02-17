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
  console.log({ rows });
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

export const selectOwnerDashboardStats = async () => {
  const pool = await getDBConnection();
  const sql = `SELECT 
(SELECT SUM(s.salesTotalAmount) FROM Sales s) AS totalSales, 
(SELECT COUNT(*) FROM Stores s) AS totalStores,
(SELECT SUM(ii.inventoryItemQuantity * i.itemPrice ) FROM InventoryItems ii INNER JOIN Items i ON i.itemId = ii.inventoryItemReferenceId AND  ii.inventoryItemReferenceType = 'item' WHERE ii.inventoryItemDeletedAt IS NULL)
AS totalInventoryCost,
(SELECT SUM(poi.unitPrice * poi.poItemReceivedQty)  FROM PurchaseOrderItems poi WHERE poi.poItemStatus = 'received' OR poi.poItemStatus = 'delivered' OR poi.poItemStatus = 'completed') AS  totalPurchase
;`;

  const [rows] = await pool.execute(sql);
  return rows;
};

export const selectStoresRecentSales = async () => {
  const pool = await getDBConnection();
  const sql = `SELECT 
  s.storeId,
    s.storeName,
    sl.salesNo,
    sl.salesTotalAmount,
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
ORDER BY sl.salesCreatedAt DESC;`;

  const [rows] = await pool.execute(sql);
  return rows;
};

export const selectSalesChartData = async ({
  year,
  storeId,
}: {
  year?: string;
  storeId?: number;
}) => {
  const pool = await getDBConnection();

  let sql = `
    SELECT 
      MONTH(s.salesCreatedAt) AS monthNumber,
      DATE_FORMAT(s.salesCreatedAt, '%M') AS monthName,
      SUM(s.salesTotalAmount) AS totalSales
    FROM Sales s
    WHERE YEAR(s.salesCreatedAt) = ?
  `;

  const params: any[] = [year];

  if (storeId) {
    sql += ` AND s.storeId = ?`;
    params.push(storeId);
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
