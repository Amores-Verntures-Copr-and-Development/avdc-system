import { CreateOrderDto, DisplayOrderDto } from "@/dtos/orders.dto";
import { getDBConnection } from "@/lib/db";
import { Orders } from "@/types/orders";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { assertKnownColumns } from "@/lib/db/assertKnownColumns";

// Column names are interpolated directly into raw SQL below (CASE/WHERE
// builders) - allowlisting against the real Orders columns prevents a
// crafted request body from injecting arbitrary SQL via an object key.
const ORDER_COLUMNS = new Set<keyof Orders>([
  "orderId",
  "orderPublicId",
  "storeId",
  "customerId",
  "orderNumber",
  "fulfillmentType",
  "deliveryAddress",
  "payMetId",
  "paymentReference",
  "paymentStatus",
  "orderStatus",
  "customerNotes",
  "internalNotes",
  "subtotal",
  "discountAmount",
  "deliveryFee",
  "totalAmount",
  "orderCreatedAt",
  "orderUpdatedAt",
  "orderDeletedAt",
]);

export const insertOrder = async ({
  connection,
  data,
  orderNumber,
  orderPublicId,
}: {
  connection?: PoolConnection;
  data: CreateOrderDto;
  orderNumber: string;
  orderPublicId: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `
    INSERT INTO Orders (
      storeId,
      customerId,
      orderNumber,
      orderPublicId,
      fulfillmentType,
      deliveryAddress,
      payMetId,
      paymentReference,
      paymentStatus,
      orderStatus,
      customerNotes,
      internalNotes,
      subtotal,
      discountAmount,
      deliveryFee,
      totalAmount
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.storeId,
    data.customerId ?? null,
    orderNumber,
    orderPublicId,
    data.fulfillmentType,
    data.deliveryAddress ?? null,
    data.payMetId,
    data.paymentReference ?? null,
    data.paymentStatus ?? "UNPAID",
    data.orderStatus ?? "PENDING",
    data.customerNotes ?? null,
    data.internalNotes ?? null,
    data.subtotal ?? 0,
    data.discountAmount ?? 0,
    data.deliveryFee ?? 0,
    data.totalAmount ?? 0,
  ]);

  return result.insertId;
};

export const selectOrders = async ({
  connection,
  keyFields = {},
  search,
  limit,
  offset,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Orders>;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `
    SELECT o.*, c.customerName, c.customerEmail, c.customerPhone, pm.payMetName, st.storeName
    FROM Orders o
    LEFT JOIN Customers c ON c.customerId = o.customerId
    LEFT JOIN PaymentMethods pm ON pm.payMetId = o.payMetId
    LEFT JOIN Stores st ON st.storeId = o.storeId
    WHERE 1=1
  `;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND o.${key} IS NULL`;
    } else {
      sql += ` AND o.${key} = ?`;
      params.push(value);
    }
  }

  if (!("orderDeletedAt" in keyFields)) {
    sql += ` AND o.orderDeletedAt IS NULL`;
  }

  if (search?.trim()) {
    sql += ` AND (o.orderNumber LIKE ? OR o.paymentReference LIKE ?)`;
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  sql += ` ORDER BY o.orderCreatedAt DESC`;

  // LIMIT/OFFSET as bound `?` params trips mysql2's execute() with
  // ER_WRONG_ARGUMENTS - interpolate directly, same as productModel.ts
  if (limit !== undefined) {
    sql += ` LIMIT ${Number(limit)}`;
    sql += ` OFFSET ${Number(offset ?? 0)}`;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows as DisplayOrderDto[];
};

export const selectCountOrders = async ({
  connection,
  keyFields = {},
  search,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Orders>;
  search?: string;
}): Promise<number> => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `SELECT COUNT(*) as total FROM Orders o WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND o.${key} IS NULL`;
    } else {
      sql += ` AND o.${key} = ?`;
      params.push(value);
    }
  }

  if (!("orderDeletedAt" in keyFields)) {
    sql += ` AND o.orderDeletedAt IS NULL`;
  }

  if (search?.trim()) {
    sql += ` AND (o.orderNumber LIKE ? OR o.paymentReference LIKE ?)`;
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return Number((rows as any)[0]?.total ?? 0);
};

export const updateOrders = async ({
  connection,
  updates,
  keyFields = ["orderId"],
}: {
  connection?: PoolConnection;
  updates: Partial<Orders>[];
  keyFields?: (keyof Orders)[];
}) => {
  const pool = connection ?? (await getDBConnection());

  if (!updates || updates.length === 0) return;

  assertKnownColumns(keyFields, ORDER_COLUMNS, "Orders");
  assertKnownColumns(Object.keys(updates[0]), ORDER_COLUMNS, "Orders");

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof Orders),
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
    UPDATE Orders
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);

  return result;
};
