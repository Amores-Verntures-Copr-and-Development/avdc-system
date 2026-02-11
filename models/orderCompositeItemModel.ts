import {
  CreateOrderCompositeItemDro,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { OrderCompositeItem } from "@/types/purchaseOrders";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertOrderCompositeItem = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateOrderCompositeItemDro[];
}) => {
  const pool = connection ? connection : await getDBConnection();
  if (!data.length) return 0;
  const sql = `
    INSERT INTO OrderCompositeItem (itemId,poItemId,reqItemId,ordComQuantity,ordComPrice,ordComCreatedBy)
    VALUES ${data.map(() => "(?, ?,?,?,?,?)").join(",")}
  `;
  const values = data.flatMap((item) => [
    item.itemId,
    item.poItemId,
    item.reqItemId || null,
    item.ordComQuantity,
    item.ordComPrice,
    item.ordComCreatedBy,
  ]);
  const [results] = await pool.execute<ResultSetHeader>(sql, values);
  return results.insertId;
};

export const selectOrderCompositeItem = async ({
  connection,
  keyfields = {},
}: {
  connection?: PoolConnection;
  keyfields: Partial<OrderCompositeItem>;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = ` 
    SELECT * FROM OrderCompositeItem oc
    LEFT JOIN Items i ON i.itemId = oc.itemId
    LEFT JOIN PurchaseOrderItems poi ON poi.poItemId = oc.poItemId
    LEFT JOIN RequestItems ri ON ri.reqItemId = oc.reqItemId
  WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyfields)) {
    if (value === null) {
      sql += ` AND oc.${key} IS NULL`;
    } else if (value === 0) {
      // Handle IS NOT NULL
      sql += ` AND oc.${key} IS NOT NULL`;
    } else {
      sql += ` AND oc.${key} = ?`;
      params.push(value);
    }
  }
  console.log({});
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};
