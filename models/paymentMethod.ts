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
  const sql = `INSERT INTO PaymentMethods(payMetName,payMetDesc,payMetHasRef,payMetIsEmail,payMetIsOnline,payMetIsCustomer,storeId,payMetCreatedBy) VALUES(?,?,?,?,?,?,?,?)`;
  const [results] = await pool.execute(sql, [
    data.payMetName,
    data.payMetDesc ?? "",
    data.payMetHasRef,
    data.payMetIsEmail || false,
    data.payMetIsOnline || false,
    data.payMetIsCustomer || false,
    data.storeId,
    data.payMetCreatedBy,
  ]);
  return results;
};

export const updatePaymentMethods = async ({
  connection,
  updates,
  keyFields = ["payMetId"],
}: {
  connection?: PoolConnection;
  updates: Partial<PaymentMethods>[];
  keyFields?: (keyof PaymentMethods)[];
}) => {
  const pool = connection ?? (await getDBConnection());

  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof PaymentMethods),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    const caseStatement = `${field} = (CASE ${caseParts.join(
      " ",
    )} ELSE ${field} END)`;
    setClauses.push(caseStatement);
  }

  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k]),
  );

  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE PaymentMethods
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);

  return result;
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
