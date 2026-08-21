import { getDBConnection } from "@/lib/db";
import { PoolConnection, RowDataPacket } from "mysql2/promise";

export const selectUserCompanyId = async ({
  connection,
  userId,
}: {
  connection?: PoolConnection;
  userId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT companyId FROM Users WHERE userId = ?`,
    [userId],
  );
  return (rows[0]?.companyId as number | undefined) ?? null;
};
