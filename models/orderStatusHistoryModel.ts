import { CreateOrderStatusHistoryDto } from "@/dtos/orders.dto";
import { getDBConnection } from "@/lib/db";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertOrderStatusHistory = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateOrderStatusHistoryDto;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `
    INSERT INTO OrderStatusHistory (orderId, orderStatus, note, changedBy)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.orderId,
    data.orderStatus,
    data.note ?? null,
    data.changedBy ?? null,
  ]);

  return result.insertId;
};

export const selectOrderStatusHistoryByOrderId = async ({
  connection,
  orderId,
}: {
  connection?: PoolConnection;
  orderId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `
    SELECT
      osh.*,
      CONCAT_WS(' ', u.userFname, u.userLname) AS changedByName
    FROM OrderStatusHistory osh
    LEFT JOIN Users u ON u.userId = osh.changedBy
    WHERE osh.orderId = ?
    ORDER BY osh.historyCreatedAt ASC, osh.historyId ASC
  `;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [orderId]);
  return rows;
};
