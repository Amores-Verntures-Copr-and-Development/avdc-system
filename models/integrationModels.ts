import { CreateIntegrationDTO } from "@/dtos/integration.dto";
import { CreateLoyverseIntegrationDTO } from "@/dtos/loyverse-integration.dto";
import { getDBConnection } from "@/lib/db";
import { IntegrationInterface } from "@/types/integrations";
import { LoyverseIntegrationInterface } from "@/types/loyverse-integration";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertIntegration = async ({
  data,
  connection,
}: {
  data: CreateIntegrationDTO;
  connection: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Integrations(storeId,integrationType) VALUES(?,?)`;

  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.storeId,
    data.integrationType,
  ]);

  return results.insertId;
};

export const selectIntegration = async ({
  connection,
  keyFields = {},
}: {
  connection: PoolConnection;
  keyFields?: Partial<Record<keyof IntegrationInterface, any>>;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `SELECT * FROM Integrations WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND ${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows as IntegrationInterface[];
};

export const updateIntegration = async ({
  connection,
  updates,
  keyFields = ["integId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<IntegrationInterface>[];
  keyFields?: (keyof IntegrationInterface)[];
}) => {
  console.log({ updates });
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof IntegrationInterface),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // Build SET clauses for each field to update
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add key values + update value
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    // Build the CASE statement for this field and add to setClauses
    const caseStatement = `${field} = (CASE ${caseParts.join(
      " ",
    )} ELSE ${field} END)`;
    setClauses.push(caseStatement);
  }

  // Build WHERE clause
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
    UPDATE Integrations
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  console.log({ sql, params });
  const [result] = await pool.execute(sql, params);

  return result;
};
