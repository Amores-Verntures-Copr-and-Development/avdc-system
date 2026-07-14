import { CreateCusEmailVerificationDto } from "@/dtos/customer.dto";
import { getDBConnection } from "@/lib/db";
import { CusEmailVerification } from "@/types/customer";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertCusEmailVerification = async ({
  data,
  connection,
}: {
  data: CreateCusEmailVerificationDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO CusEmailVerifications(cusAccId,codeHash,expiresAt) VALUES (?,?,?)`;
  const values = [data.cusAccId, data.codeHash, data.expiresAt];
  const [result] = await pool.execute<ResultSetHeader>(sql, values);
  return result.insertId;
};

export const selectCusEmailVerification = async ({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<Record<keyof CusEmailVerification, any>>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];
  let sql = `SELECT * FROM CusEmailVerifications WHERE 1 = 1`;

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === undefined) continue;

    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }

  sql += ` ORDER BY cusEmailVerId DESC`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as CusEmailVerification[];
};

export const updateCusEmailVerification = async ({
  cusEmailVerId,
  updateData,
  connection,
}: {
  cusEmailVerId: number;
  updateData: Partial<CusEmailVerification>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const fields = Object.keys(updateData);
  if (fields.length === 0) return;

  const setClauses = fields.map((field) => `${field} = ?`);
  const params = fields.map((field) => (updateData as any)[field]);
  params.push(cusEmailVerId);

  const sql = `UPDATE CusEmailVerifications SET ${setClauses.join(", ")} WHERE cusEmailVerId = ?`;
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
};
