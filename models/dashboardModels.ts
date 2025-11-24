import { getDBConnection } from "@/lib/db";

export const selectPurchaserStats = async (userId: number) => {
  const pool = await getDBConnection();
  const sql = `SELECT 
    (SELECT COUNT(*) FROM PurchaseOrders po WHERE po.poCreatedBy = ? ) AS totalPurchase,
    ( SELECT COUNT(*) FROM RequestOrders ro
	 LEFT JOIN StockStores ss ON ro.storeId = ro.storeId
	 LEFT JOIN StockPurchasers sp ON sp.stockRoomId = ss.stockRoomId
	 WHERE ro.requestStatus = 'completed' AND  sp.userId = ?) AS completedRequest,
    (SELECT COUNT(*) 
     FROM InventoryItems ii 
     LEFT JOIN Inventories i ON i.inventoryId = ii.inventoryId  
     LEFT JOIN StockRooms sr ON sr.stockRoomId = i.inventoryReferenceId AND i.inventoryReference = 'stock-room'
	  LEFT JOIN StockPurchasers sp ON sp.stockRoomId = sr.stockRoomId
     WHERE sp.userId = ?
     AND ii.inventoryItemQuantity < ii.inventoryItemMin) AS lowStock,
    (SELECT COUNT(*) 
     FROM InventoryItems ii 
     LEFT JOIN Inventories i ON i.inventoryId = ii.inventoryId  
     LEFT JOIN StockRooms sr ON sr.stockRoomId = i.inventoryReferenceId AND i.inventoryReference = 'stock-room'
	  LEFT JOIN StockPurchasers sp ON sp.stockRoomId = sr.stockRoomId
     WHERE sp.userId = ?
     AND ii.inventoryItemQuantity = 0
    ) AS outOfStock;`;

  const [rows] = await pool.execute(sql, [userId, userId, userId, userId]);
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
