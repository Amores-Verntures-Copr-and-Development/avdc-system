import { CreateCompanyDto, DisplayCompanyDto } from "@/dtos/company.dto";
import { getDBConnection } from "@/lib/db";
import { assertKnownColumns } from "@/lib/db/assertKnownColumns";
import { Companies } from "@/types/company";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

const COMPANY_COLUMNS = new Set<keyof Companies>([
  "companyId",
  "companyName",
  "companyEmail",
  "companyPhone",
  "companyStatus",
  "companyCreatedAt",
  "companyUpdatedAt",
  "companyDeletedAt",
  "companyCreatedBy",
  "companyMaxStores",
  "companyInstallmentEnabled",
]);

export const insertCompany = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateCompanyDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `
    INSERT INTO Companies (
      companyName, companyEmail, companyPhone, companyStatus,
      companyCreatedBy, companyMaxStores, companyInstallmentEnabled
    )
    VALUES (?,?,?,?,?,?,?)
  `;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.companyName,
    data.companyEmail ?? null,
    data.companyPhone ?? null,
    data.companyStatus ?? "active",
    data.companyCreatedBy,
    data.companyMaxStores ?? 0,
    data.companyInstallmentEnabled ? 1 : 0,
  ]);
  return result.insertId;
};

export const selectCompanies = async ({
  connection,
  keyFields = {},
  search,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Companies>;
  search?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  // Correlated subqueries (not JOIN + COUNT DISTINCT) - joining both Users
  // and Stores directly would cross-multiply their rows per company and
  // inflate both counts.
  let sql = `
    SELECT
      c.*,
      (SELECT COUNT(*) FROM Users u WHERE u.companyId = c.companyId) AS userCount,
      (SELECT COUNT(*) FROM Stores s WHERE s.companyId = c.companyId AND s.storeDeletedAt IS NULL) AS storeCount
    FROM Companies c
    WHERE 1=1
  `;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND c.${key} IS NULL`;
    } else {
      sql += ` AND c.${key} = ?`;
      params.push(value);
    }
  }

  if (!("companyDeletedAt" in keyFields)) {
    sql += ` AND c.companyDeletedAt IS NULL`;
  }

  if (search?.trim()) {
    sql += ` AND c.companyName LIKE ?`;
    params.push(`%${search.trim()}%`);
  }

  sql += ` ORDER BY c.companyName ASC`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as DisplayCompanyDto[];
};

export const updateCompany = async ({
  connection,
  updates,
  keyFields = ["companyId"],
}: {
  connection?: PoolConnection;
  updates: Partial<Companies>[];
  keyFields?: (keyof Companies)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  assertKnownColumns(keyFields, COMPANY_COLUMNS, "Companies");
  assertKnownColumns(Object.keys(updates[0]), COMPANY_COLUMNS, "Companies");

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof Companies),
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
      : `${keyFields[0]} IN (${uniqueKeyCombinations.map(() => "?").join(",")})`;

  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE Companies
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);
  return result;
};
