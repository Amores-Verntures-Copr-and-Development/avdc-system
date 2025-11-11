import { getDBConnection } from "@/lib/db";

export const selectPurchaserStats = async () => {
  const pool = await getDBConnection();
  const sql = `SELECT 
    (SELECT COUNT(*) FROM PurchaseOrders) AS totalPurchase,
    (SELECT COUNT(*) FROM RequestOrders ro WHERE ro.requestStatus = 'pending') AS pendingRequest,
    (SELECT COUNT(*) 
     FROM InventoryItems ii 
     LEFT JOIN Inventory i ON i.inventoryId = ii.inventoryId  
     WHERE i.storeId IS NULL 
     AND ii.inventoryItemQuantity < ii.inventoryItemMin
    ) AS lowStock,
    (SELECT COUNT(*) 
     FROM InventoryItems 
     WHERE inventoryItemQuantity = 0
    ) AS outOfStock;`;

  const [rows] = await pool.execute(sql);
  return rows;
};
