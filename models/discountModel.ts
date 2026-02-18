import { CreateDiscountDto } from "@/dtos/discounts.dto";
import { getDBConnection } from "@/lib/db";
import { Discounts } from "@/types/discount";
import { PoolConnection, RowDataPacket } from "mysql2/promise";

export const insertSalesDiscount = async ({
  connection,
  data,
}: {
  data: CreateDiscountDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Discounts(discountName,discountValue,discountCreatedBy,storeId,discountType)
  VALUES(?,?,?,?,?)`;
  const [results] = await pool.execute(sql, [
    data.discountName,
    data.discountValue,
    data.discountCreatedBy,
    data.storeId,
    data.discountType,
  ]);
  return results;
};

export const selectSalesDiscounts = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Discounts>;
  search?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT * FROM Discounts WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as Discounts[];
};
