import { CreateCusPasswordResetDto } from "@/dtos/customer.dto";
import { getDBConnection } from "@/lib/db";
import { CusPasswordReset } from "@/types/customer";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertCusPasswordReset = async ({
  data,
  connection,
}: {
  data: CreateCusPasswordResetDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO CusPasswordResets(cusAccId,codeHash,expiresAt) VALUES (?,?,?)`;
  const values = [data.cusAccId, data.codeHash, data.expiresAt];
  const [result] = await pool.execute<ResultSetHeader>(sql, values);
  return result.insertId;
};

export const selectCusPasswordReset = async ({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<Record<keyof CusPasswordReset, any>>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];
  let sql = `SELECT * FROM CusPasswordResets WHERE 1 = 1`;

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === undefined) continue;

    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }

  sql += ` ORDER BY cusPassResetId DESC`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as CusPasswordReset[];
};

export const updateCusPasswordReset = async ({
  cusPassResetId,
  updateData,
  connection,
}: {
  cusPassResetId: number;
  updateData: Partial<CusPasswordReset>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const fields = Object.keys(updateData);
  if (fields.length === 0) return;

  const setClauses = fields.map((field) => `${field} = ?`);
  const params = fields.map((field) => (updateData as any)[field]);
  params.push(cusPassResetId);

  const sql = `UPDATE CusPasswordResets SET ${setClauses.join(", ")} WHERE cusPassResetId = ?`;
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
};
