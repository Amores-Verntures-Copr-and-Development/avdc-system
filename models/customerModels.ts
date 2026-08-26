import {
  CreateCustomerAccountDto,
  CreateCustomerDto,
} from "@/dtos/customer.dto";
import { getDBConnection } from "@/lib/db";
import { assertKnownColumns } from "@/lib/db/assertKnownColumns";
import { Barcodes } from "@/types/barcode";
import { Customer, CustomerAccount } from "@/types/customer";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Column names are interpolated directly into raw SQL below (CASE/WHERE
// builders) - allowlisting against the real Customers columns prevents a
// crafted request body (only loosely typed as Partial<Customer>) from
// injecting arbitrary SQL via an object key.
const CUSTOMER_COLUMNS = new Set<keyof Customer>([
  "customerId",
  "customerName",
  "customerEmail",
  "customerAddress",
  "customerPhone",
  "customerType",
  "customerSource",
  "customerCreatedAt",
  "customerUpdatedAt",
  "customerDeletedAt",
  "customerCreatedBy",
  "storeId",
]);

export const insertCustomer = async ({
  data,
  connection,
}: {
  data: CreateCustomerDto[];
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Customers(customerName,customerEmail,customerAddress,customerPhone,customerType,customerCreatedBy,storeId) VALUES ${data.map(() => "(?,?,?,?,?,?,?)")} `;
  const values = data.flatMap((item) => [
    item.customerName ?? "",
    item.customerEmail ?? "",
    item.customerAddress ?? "",
    item.customerPhone ?? "",
    item.customerType,
    item.customerCreatedBy,
    item.storeId,
  ]);
  const [result] = await pool.execute<ResultSetHeader>(sql, values);
  return result.insertId;
};

export const selectCustomers = async ({
  keyFields = {},
  connection,
  limit,
  offset,
  search,
  type,
  store,
  from,
  to,
  sort,
  order,
  paymentMethods,
  includePaymentMethods,
}: {
  keyFields?: Partial<Customer>;
  connection?: PoolConnection;
  search?: string;
  type?: string;
  limit?: number;
  offset?: number;
  store?: string;
  from?: string;
  to?: string;
  sort?: string;
  order?: "asc" | "desc";
  paymentMethods?: string[];
  // Only the single-customer detail fetch needs this - a per-row correlated
  // subquery isn't worth paying for on the paginated Customers list, which
  // never displays it.
  includePaymentMethods?: boolean;
}) => {
  const pool = connection ?? (await getDBConnection());
  const allowedSorts: Record<string, string> = {
    customerName: "c.customerName",
  };
  const safeLimit =
    limit !== undefined ? Math.max(1, Math.floor(Number(limit))) : undefined;

  const safeOffset =
    offset !== undefined ? Math.max(0, Math.floor(Number(offset))) : undefined;
  const params: unknown[] = [];

  // SalesRefunds is a separate append-only ledger - Sales.salesTotalAmount
  // is never decremented when a refund happens, so it has to be netted out
  // here explicitly or a refunded sale gets counted at its full original
  // amount.
  let totalSpentExpression = `
    COALESCE(SUM(sa.salesTotalAmount - COALESCE(sr.totalRefunds, 0)), 0)
  `;

  if (from && to && !(paymentMethods && paymentMethods.length > 0)) {
    totalSpentExpression = `
      COALESCE(
        SUM(
          CASE
            WHEN DATE(CONVERT_TZ(sa.salesCreatedAt, '+00:00', '+08:00')) >= ?
              AND DATE(CONVERT_TZ(sa.salesCreatedAt, '+00:00', '+08:00')) <= ?
            THEN sa.salesTotalAmount - COALESCE(sr.totalRefunds, 0)
            ELSE 0
          END
        ),
        0
      )
    `;

    params.push(from, to);
  }

  // When filtering by payment method, "Total Spent" should reflect only
  // what was actually paid via that method (net of refunds against that
  // same method) - not the customer's full sale totals. This can't be
  // expressed off the `sa` join above (a sale's salesTotalAmount isn't
  // split per payment method), so it's computed as two independent
  // correlated subqueries over SalesPayments/SalesPaymentRefunds instead
  // (mutually exclusive with the from/to-only branch above, since it
  // replaces totalSpentExpression rather than extending it - the params
  // pushed there would otherwise be left dangling with no matching `?`).
  if (paymentMethods && paymentMethods.length > 0) {
    const dateClause =
      from && to
        ? `AND DATE(CONVERT_TZ(s2.salesCreatedAt, '+00:00', '+08:00')) >= ? AND DATE(CONVERT_TZ(s2.salesCreatedAt, '+00:00', '+08:00')) <= ?`
        : "";
    const refundDateClause =
      from && to
        ? `AND DATE(CONVERT_TZ(s3.salesCreatedAt, '+00:00', '+08:00')) >= ? AND DATE(CONVERT_TZ(s3.salesCreatedAt, '+00:00', '+08:00')) <= ?`
        : "";
    const placeholders = paymentMethods.map(() => "?").join(", ");

    totalSpentExpression = `
      COALESCE((
        SELECT SUM(sp.salesPaymentAmount)
        FROM SalesPayments sp
        JOIN Sales s2 ON s2.salesId = sp.salesId
        JOIN PaymentMethods pm2 ON pm2.payMetId = sp.payMetId
        WHERE s2.customerId = c.customerId
          AND s2.storeId = c.storeId
          AND pm2.payMetName IN (${placeholders})
          ${dateClause}
      ), 0)
      -
      COALESCE((
        SELECT SUM(spr.salesPayRefAmount)
        FROM SalesPaymentRefunds spr
        JOIN SalesRefunds sr2 ON sr2.salesRefId = spr.salesRefId
        JOIN Sales s3 ON s3.salesId = sr2.salesId
        JOIN PaymentMethods pm3 ON pm3.payMetId = spr.paymetId
        WHERE s3.customerId = c.customerId
          AND s3.storeId = c.storeId
          AND pm3.payMetName IN (${placeholders})
          ${refundDateClause}
      ), 0)
    `;

    params.push(...paymentMethods);
    if (from && to) params.push(from, to);
    params.push(...paymentMethods);
    if (from && to) params.push(from, to);
  }

  // Per-method totals (net of refunds against that method) for this
  // customer - separate correlated subqueries per payment method rather
  // than one joined query, same reasoning as totalSpentExpression above:
  // joining SalesPayments and SalesPaymentRefunds directly would fan out
  // and double-count. Respects the same date range and payment-method
  // filter as totalSpentExpression, so the breakdown and the total agree.
  let paymentMethodsExpression = "";
  if (includePaymentMethods) {
    const methodFilterClause =
      paymentMethods && paymentMethods.length > 0
        ? `AND pm.payMetName IN (${paymentMethods.map(() => "?").join(", ")})`
        : "";
    const dateClause =
      from && to
        ? `AND DATE(CONVERT_TZ(s4.salesCreatedAt, '+00:00', '+08:00')) >= ? AND DATE(CONVERT_TZ(s4.salesCreatedAt, '+00:00', '+08:00')) <= ?`
        : "";
    const refundDateClause =
      from && to
        ? `AND DATE(CONVERT_TZ(s5.salesCreatedAt, '+00:00', '+08:00')) >= ? AND DATE(CONVERT_TZ(s5.salesCreatedAt, '+00:00', '+08:00')) <= ?`
        : "";

    paymentMethodsExpression = `
      (
        SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
          'payMetName', pmb.payMetName,
          'salesPayAmount', pmb.salesPayAmount
        )), JSON_ARRAY())
        FROM (
          SELECT
            pm.payMetId,
            pm.payMetName,
            COALESCE(SUM(sp.salesPaymentAmount), 0) - COALESCE((
              SELECT SUM(spr.salesPayRefAmount)
              FROM SalesPaymentRefunds spr
              JOIN SalesRefunds sr4 ON sr4.salesRefId = spr.salesRefId
              JOIN Sales s5 ON s5.salesId = sr4.salesId
              WHERE s5.customerId = c.customerId
                AND s5.storeId = c.storeId
                AND spr.paymetId = pm.payMetId
                ${refundDateClause}
            ), 0) AS salesPayAmount
          FROM SalesPayments sp
          JOIN Sales s4 ON s4.salesId = sp.salesId
          JOIN PaymentMethods pm ON pm.payMetId = sp.payMetId
          WHERE s4.customerId = c.customerId AND s4.storeId = c.storeId
            ${methodFilterClause}
            ${dateClause}
          GROUP BY pm.payMetId, pm.payMetName
        ) pmb
      ) AS paymentMethods,
    `;

    // Push order must match placeholder order in the string above: the
    // nested refund subquery's date range appears first (it's textually
    // inside the SELECT list, before the outer FROM/WHERE), then the
    // method filter, then the outer date range.
    if (from && to) params.push(from, to);
    if (paymentMethods && paymentMethods.length > 0) {
      params.push(...paymentMethods);
    }
    if (from && to) params.push(from, to);
  }

  let sql = `
    SELECT
      c.customerId,
      c.customerName,
      c.customerEmail,
      c.customerPhone,
      c.customerType,
      c.storeId,
      st.storeName,
      c.customerCreatedAt,
      c.customerUpdatedAt,
      c.customerAddress,
      ${totalSpentExpression} AS totalSpent,
      MAX(sa.salesCreatedAt) AS lastVisit,
      MIN(sa.salesCreatedAt) AS firstVisit,
      ${paymentMethodsExpression}
      ca.cusAccId,
      ca.accountEmail,
      ca.cusAccStatus,
      ca.emailVerified,
      ca.accountCreatedAt
    FROM Customers c
    LEFT JOIN Stores st
      ON st.storeId = c.storeId
    LEFT JOIN Sales sa
      ON sa.customerId = c.customerId AND sa.storeId = c.storeId
    LEFT JOIN (
      SELECT salesId, SUM(salesRefAmount) AS totalRefunds
      FROM SalesRefunds
      GROUP BY salesId
    ) sr ON sr.salesId = sa.salesId
    LEFT JOIN (
      SELECT
        customerId,
        MAX(cusAccId) AS cusAccId,
        MAX(email) AS accountEmail,
        MAX(cusAccStatus) AS cusAccStatus,
        MAX(emailVerified) AS emailVerified,
        MAX(cusAccCreatedAt) AS accountCreatedAt
      FROM CustomerAccounts
      WHERE cusAccDeletedAt IS NULL
      GROUP BY customerId
    ) ca ON ca.customerId = c.customerId
    WHERE 1 = 1
  `;

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === undefined) continue;

    if (value === null) {
      sql += ` AND c.${key} IS NULL`;
    } else {
      sql += ` AND c.${key} = ?`;
      params.push(value);
    }
  }

  if (search) {
    const searchValue = `%${search}%`;

    sql += `
      AND (
        c.customerName LIKE ?
        OR c.customerEmail LIKE ?
        OR c.customerPhone LIKE ?
      )
    `;

    params.push(searchValue, searchValue, searchValue);
  }

  if (type) {
    sql += ` AND c.customerType = ?`;
    params.push(type);
  }

  if (store) {
    sql += ` AND st.storeName = ?`;
    params.push(store);
  }

  // Filtered against the customer's full sales history via a correlated
  // EXISTS (not a join on the already-aggregated `sa`) so this only
  // narrows *which customers* show up - it must not drop the sales rows
  // that feed totalSpent/lastVisit/firstVisit above, or a customer who
  // also paid by other methods would show an incomplete total.
  if (paymentMethods && paymentMethods.length > 0) {
    sql += `
      AND EXISTS (
        SELECT 1
        FROM Sales pmSales
        JOIN SalesPayments pmPayments ON pmPayments.salesId = pmSales.salesId
        JOIN PaymentMethods pmMethods ON pmMethods.payMetId = pmPayments.payMetId
        WHERE pmSales.customerId = c.customerId
          AND pmMethods.payMetName IN (${paymentMethods.map(() => "?").join(", ")})
      )
    `;
    params.push(...paymentMethods);
  }

  sql += `
    GROUP BY
      c.customerId,
      c.customerName,
      c.customerEmail,
      c.customerPhone,
      c.customerType,
      c.storeId,
      st.storeName,
      c.customerCreatedAt,
      c.customerUpdatedAt,
      c.customerAddress,
      ca.cusAccId,
      ca.accountEmail,
      ca.cusAccStatus,
      ca.emailVerified,
      ca.accountCreatedAt
  `;

  if (sort && order && allowedSorts[sort]) {
    sql += ` ORDER BY ${allowedSorts[sort]} ${order.toUpperCase()}`;
  }

  if (safeLimit !== undefined && Number.isFinite(safeLimit)) {
    sql += ` LIMIT ${safeLimit}`;
  }

  if (safeOffset !== undefined && Number.isFinite(safeOffset)) {
    sql += ` OFFSET ${safeOffset}`;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as Customer[];
};

export const selectCountCustomers = async ({
  keyFields = {},
  connection,
  search,
  store,
  paymentMethods,
}: {
  keyFields?: Partial<Customer>;
  connection?: PoolConnection;
  from?: string;
  to?: string;
  search?: string;
  store?: string;
  paymentMethods?: string[];
}) => {
  const pool = connection ?? (await getDBConnection());

  const params: unknown[] = [];

  let sql = `
    SELECT COUNT(DISTINCT c.customerId) AS totalCustomer
    FROM Customers c
    LEFT JOIN Stores st ON st.storeId = c.storeId
    LEFT JOIN Sales sa ON sa.customerId = c.customerId
    WHERE 1 = 1
  `;

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === undefined) continue;

    if (value === null) {
      sql += ` AND c.${key} IS NULL`;
    } else {
      sql += ` AND c.${key} = ?`;
      params.push(value);
    }
  }

  if (store) {
    sql += ` AND st.storeName = ?`;
    params.push(store);
  }

  if (search) {
    const searchValue = `%${search}%`;

    sql += `
      AND (
        c.customerName LIKE ?
        OR c.customerEmail LIKE ?
        OR c.customerPhone LIKE ?
      )
    `;

    params.push(searchValue, searchValue, searchValue);
  }

  if (paymentMethods && paymentMethods.length > 0) {
    sql += `
      AND EXISTS (
        SELECT 1
        FROM Sales pmSales
        JOIN SalesPayments pmPayments ON pmPayments.salesId = pmSales.salesId
        JOIN PaymentMethods pmMethods ON pmMethods.payMetId = pmPayments.payMetId
        WHERE pmSales.customerId = c.customerId
          AND pmMethods.payMetName IN (${paymentMethods.map(() => "?").join(", ")})
      )
    `;
    params.push(...paymentMethods);
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows[0];
};
export const updateCustomers = async ({
  connection,
  updates,
  keyFields = ["customerId"],
}: {
  connection?: PoolConnection;
  updates: Partial<Customer>[];
  keyFields?: (keyof Customer)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  assertKnownColumns(keyFields, CUSTOMER_COLUMNS, "Customers");
  assertKnownColumns(Object.keys(updates[0]), CUSTOMER_COLUMNS, "Customers");

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof Customer),
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
    UPDATE Customers
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);
  return result;
};

export const insertCustomerAccount = async ({
  data,
  connection,
}: {
  data: CreateCustomerAccountDto[];
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO CustomerAccounts(firstName,middleName,lastName,company,email,password,customerId) VALUES ${data.map(() => "(?,?,?,?,?,?,?)")} `;
  const values = data.flatMap((item) => [
    item.firstName,
    item.middleName,
    item.lastName,
    item.company,
    item.email,
    item.password,
    item.customerId,
  ]);
  const [result] = await pool.execute<ResultSetHeader>(sql, values);
  return result.insertId;
};

export const selectCustomerAcconts = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof CustomerAccount, any>>;
}) => {
  const params: any[] = [];
  let sql = `SELECT ca.cusAccId,ca.firstName,ca.middleName,ca.lastName,ca.company,ca.email,ca.password,ca.emailVerified,ca.phoneVerified FROM CustomerAccounts ca WHERE 1 = 1`;
  const pool = connection ? connection : await getDBConnection();
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ca.${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND ca.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND ca.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as CustomerAccount[];
};

export const updateCustomerAccounts = async ({
  cusAccId,
  updateData,
  connection,
}: {
  cusAccId: number;
  updateData: Partial<CustomerAccount>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const fields = Object.keys(updateData);
  if (fields.length === 0) return;

  const setClauses = fields.map((field) => `${field} = ?`);
  const params = fields.map((field) => (updateData as any)[field]);
  params.push(cusAccId);

  const sql = `UPDATE CustomerAccounts SET ${setClauses.join(", ")} WHERE cusAccId = ?`;
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
};
