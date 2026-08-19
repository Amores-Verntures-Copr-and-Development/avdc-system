import { CreateOrderItemDto, DisplayOrderItemDto } from "@/dtos/orders.dto";
import { getDBConnection } from "@/lib/db";
import { OrderItems } from "@/types/orders";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { assertKnownColumns } from "@/lib/db/assertKnownColumns";

// lineTotal is a generated column (quantity * unitPrice) - never write to it.
// This denylist only decides which *known, real* columns are business-logic
// writable; it does NOT guard against SQL injection (a denylist can't stop an
// attacker inventing a brand-new field name) - that's what ORDER_ITEM_COLUMNS
// / assertKnownColumns below is for.
const NON_WRITABLE_FIELDS: (keyof OrderItems)[] = [
  "lineTotal",
  "orderItemCreatedAt",
  "orderItemUpdatedAt",
];

// Column names are interpolated directly into raw SQL below (CASE/WHERE
// builders) - allowlisting against the real OrderItems columns prevents a
// crafted request body from injecting arbitrary SQL via an object key.
const ORDER_ITEM_COLUMNS = new Set<keyof OrderItems>([
  "orderItemId",
  "orderId",
  "prodVarId",
  "quantity",
  "unitPrice",
  "lineTotal",
  "itemStatus",
  "notes",
  "orderItemCreatedAt",
  "orderItemUpdatedAt",
]);

export const insertOrderItems = async ({
  connection,
  orderId,
  data,
}: {
  connection?: PoolConnection;
  orderId: number;
  data: CreateOrderItemDto[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No order items provided");
  }

  const pool = connection ? connection : await getDBConnection();

  const sql = `
    INSERT INTO OrderItems (
      orderId,
      prodVarId,
      quantity,
      unitPrice,
      itemStatus,
      notes
    ) VALUES ${data.map(() => "(?,?,?,?,?,?)").join(",")}
  `;

  const values = data.flatMap((item) => [
    orderId,
    item.prodVarId,
    item.quantity,
    item.unitPrice,
    item.itemStatus ?? "PENDING",
    item.notes ?? null,
  ]);

  const [result] = await pool.execute<ResultSetHeader>(sql, values);

  return result;
};

export const selectOrderItemsByOrderId = async ({
  connection,
  orderId,
}: {
  connection?: PoolConnection;
  orderId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `
    SELECT
      oi.*,
      pv.prodVarName,
      pv.prodVarUnit,
      pv.prodVarImage
    FROM OrderItems oi
    LEFT JOIN ProductVariants pv ON pv.prodVarId = oi.prodVarId
    WHERE oi.orderId = ?
    ORDER BY oi.orderItemCreatedAt ASC
  `;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [orderId]);

  return rows as DisplayOrderItemDto[];
};

export const updateOrderItems = async ({
  connection,
  updates,
  keyFields = ["orderItemId"],
}: {
  connection?: PoolConnection;
  updates: Partial<OrderItems>[];
  keyFields?: (keyof OrderItems)[];
}) => {
  const pool = connection ?? (await getDBConnection());

  if (!updates || updates.length === 0) return;

  assertKnownColumns(keyFields, ORDER_ITEM_COLUMNS, "OrderItems");
  assertKnownColumns(Object.keys(updates[0]), ORDER_ITEM_COLUMNS, "OrderItems");

  const updateFields = Object.keys(updates[0]).filter(
    (field) =>
      !keyFields.includes(field as keyof OrderItems) &&
      !NON_WRITABLE_FIELDS.includes(field as keyof OrderItems),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key/non-writable fields).");

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
    UPDATE OrderItems
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);

  return result;
};

export const deleteOrderItems = async ({
  connection,
  orderItemIds,
}: {
  connection?: PoolConnection;
  orderItemIds: number[];
}) => {
  if (!orderItemIds || orderItemIds.length === 0) return;

  const pool = connection ? connection : await getDBConnection();

  const sql = `DELETE FROM OrderItems WHERE orderItemId IN (${orderItemIds
    .map(() => "?")
    .join(",")})`;

  const [result] = await pool.execute<ResultSetHeader>(sql, orderItemIds);

  return result;
};
