import { CreatePaymentMethodDto } from "@/dtos/paymentMethods.dto";
import { getDBConnection } from "@/lib/db";
import { PaymentMethods } from "@/types/payment-methods";
import { PoolConnection, RowDataPacket } from "mysql2/promise";

export const insertPaymentMethod = async ({
  connection,
  data,
}: {
  data: CreatePaymentMethodDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO PaymentMethods(payMetName,payMetDesc,payMetHasRef,payMetIsEmail,storeId,payMetCreatedBy) VALUES(?,?,?,?,?,?)`;
  const [results] = await pool.execute(sql, [
    data.payMetName,
    data.payMetDesc ?? "",
    data.payMetHasRef,
    data.payMetIsEmail || false,
    data.storeId,
    data.payMetCreatedBy,
  ]);
  return results;
};

export const selectPaymentMethods = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<PaymentMethods>;
  search?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT * FROM PaymentMethods WHERE 1=1`;
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
  return rows as PaymentMethods[];
};

export const selectPaymentMethodByNameAndStore = async ({
  connection,
  name,
  storeId,
}: {
  connection?: PoolConnection;
  name: string;
  storeId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT * FROM PaymentMethods pm WHERE pm.payMetName = ? AND pm.storeId = ?`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [name, storeId]);
  return rows as PaymentMethods[];
};
