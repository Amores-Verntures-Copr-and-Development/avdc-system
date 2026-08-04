import { CreateVoucherDto, UpdateVoucherDto } from "@/dtos/voucher.dto";
import { getDBConnection } from "@/lib/db";
import { DisplayVoucher, SalesVoucher, Voucher } from "@/types/voucher";
import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

const SELECT_VOUCHER_SQL = `
  SELECT
    v.*,
    CONCAT_WS(' ', u.userName, u.userLname) AS voucherIssuedByName,
    c.customerName AS voucherIssuedToName,
    COALESCE(
      (
        SELECT JSON_ARRAYAGG(vs.storeId)
        FROM VoucherStore vs
        WHERE vs.voucherId = v.voucherId
      ),
      JSON_ARRAY()
    ) AS storeIds
  FROM Vouchers v
  LEFT JOIN Users u ON u.userId = v.voucherIssuedBy
  LEFT JOIN Customers c ON c.customerId = v.voucherIssuedTo
`;

export const insertVoucher = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateVoucherDto;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `
    INSERT INTO Vouchers (
      voucherCode,
      voucherName,
      voucherValueType,
      voucherFixedValue,
      voucherPercent,
      voucherMaxDiscount,
      voucherBalance,
      voucherMaxUses,
      voucherStatus,
      voucherExpiresAt,
      voucherIsAllStores,
      voucherIssuedTo,
      voucherIssuedBy,
      voucherRemarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.voucherCode,
    data.voucherName ?? null,
    data.voucherValueType,
    data.voucherFixedValue ?? null,
    data.voucherPercent ?? null,
    data.voucherMaxDiscount ?? null,
    data.voucherValueType === "fixed" ? data.voucherFixedValue : null,
    data.voucherMaxUses ?? 1,
    data.voucherExpiresAt ?? null,
    data.voucherIsAllStores ? 1 : 0,
    data.voucherIssuedTo ?? null,
    data.voucherIssuedBy,
    data.voucherRemarks ?? null,
  ]);

  return result;
};

export const insertVoucherStores = async ({
  connection,
  voucherId,
  storeIds,
}: {
  connection?: PoolConnection;
  voucherId: number;
  storeIds: number[];
}) => {
  if (storeIds.length === 0) return;

  const pool = connection ? connection : await getDBConnection();

  const sql = `
    INSERT INTO VoucherStore (voucherId, storeId)
    VALUES ${storeIds.map(() => "(?, ?)").join(", ")}
  `;

  const values = storeIds.flatMap((storeId) => [voucherId, storeId]);

  await pool.execute<ResultSetHeader>(sql, values);
};

export const deleteVoucherStoresByVoucherId = async ({
  connection,
  voucherId,
}: {
  connection?: PoolConnection;
  voucherId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  await pool.execute<ResultSetHeader>(
    `DELETE FROM VoucherStore WHERE voucherId = ?`,
    [voucherId],
  );
};

export const selectVouchers = async ({
  connection,
  search,
  status,
  limit,
  offset,
}: {
  connection?: PoolConnection;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];

  let sql = `${SELECT_VOUCHER_SQL} WHERE v.voucherDeletedAt IS NULL`;

  if (search) {
    sql += ` AND (v.voucherCode LIKE ? OR v.voucherName LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    sql += ` AND v.voucherStatus = ?`;
    params.push(status);
  }

  sql += ` ORDER BY v.voucherCreatedAt DESC`;

  if (limit !== undefined) {
    sql += ` LIMIT ${limit}`;
  }
  if (offset !== undefined) {
    sql += ` OFFSET ${offset}`;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as DisplayVoucher[];
};

export const countVouchers = async ({
  connection,
  search,
  status,
}: {
  connection?: PoolConnection;
  search?: string;
  status?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];

  let sql = `SELECT COUNT(*) AS count FROM Vouchers v WHERE v.voucherDeletedAt IS NULL`;

  if (search) {
    sql += ` AND (v.voucherCode LIKE ? OR v.voucherName LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    sql += ` AND v.voucherStatus = ?`;
    params.push(status);
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as { count: number }[];
};

export const selectVoucherById = async ({
  connection,
  voucherId,
}: {
  connection?: PoolConnection;
  voucherId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `${SELECT_VOUCHER_SQL} WHERE v.voucherId = ? AND v.voucherDeletedAt IS NULL`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [voucherId]);
  return (rows as DisplayVoucher[])[0] ?? null;
};

export const selectVoucherByCode = async ({
  connection,
  voucherCode,
}: {
  connection?: PoolConnection;
  voucherCode: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `${SELECT_VOUCHER_SQL} WHERE v.voucherCode = ? AND v.voucherDeletedAt IS NULL`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [voucherCode]);
  return (rows as DisplayVoucher[])[0] ?? null;
};

export const updateVoucher = async ({
  connection,
  voucherId,
  data,
}: {
  connection?: PoolConnection;
  voucherId: number;
  data: UpdateVoucherDto;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const fields: string[] = [];
  const params: any[] = [];

  const fieldMap: Partial<Record<keyof UpdateVoucherDto, string>> = {
    voucherName: "voucherName",
    voucherFixedValue: "voucherFixedValue",
    voucherPercent: "voucherPercent",
    voucherMaxDiscount: "voucherMaxDiscount",
    voucherMaxUses: "voucherMaxUses",
    voucherExpiresAt: "voucherExpiresAt",
    voucherIssuedTo: "voucherIssuedTo",
    voucherRemarks: "voucherRemarks",
  };

  for (const [key, column] of Object.entries(fieldMap)) {
    const value = data[key as keyof UpdateVoucherDto];
    if (value !== undefined) {
      fields.push(`${column} = ?`);
      params.push(value);
    }
  }

  if (data.voucherIsAllStores !== undefined) {
    fields.push(`voucherIsAllStores = ?`);
    params.push(data.voucherIsAllStores ? 1 : 0);
  }

  if (fields.length === 0) {
    return null;
  }

  params.push(voucherId);

  const sql = `UPDATE Vouchers SET ${fields.join(", ")} WHERE voucherId = ?`;

  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
};

export const updateVoucherBalance = async ({
  connection,
  voucherId,
  voucherBalance,
}: {
  connection?: PoolConnection;
  voucherId: number;
  voucherBalance: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE Vouchers SET voucherBalance = ? WHERE voucherId = ?`,
    [voucherBalance, voucherId],
  );
  return result;
};

export const updateVoucherStatus = async ({
  connection,
  voucherId,
  voucherStatus,
}: {
  connection?: PoolConnection;
  voucherId: number;
  voucherStatus: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE Vouchers SET voucherStatus = ? WHERE voucherId = ?`,
    [voucherStatus, voucherId],
  );
  return result;
};

// Applies one redemption to a voucher: decrements balance (fixed type),
// increments usedCount, and flips to 'redeemed' once the voucher is
// fully spent (balance hits 0) or has hit its use-count cap (percent type).
export const applyVoucherRedemption = async ({
  connection,
  voucherId,
  appliedAmount,
}: {
  connection?: PoolConnection;
  voucherId: number;
  appliedAmount: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `
    UPDATE Vouchers
    SET
      voucherBalance = CASE
        WHEN voucherValueType = 'fixed' THEN GREATEST(voucherBalance - ?, 0)
        ELSE voucherBalance
      END,
      voucherUsedCount = voucherUsedCount + 1,
      voucherStatus = CASE
        WHEN voucherValueType = 'fixed' AND GREATEST(voucherBalance - ?, 0) <= 0 THEN 'redeemed'
        WHEN voucherValueType = 'percent' AND (voucherUsedCount + 1) >= voucherMaxUses THEN 'redeemed'
        ELSE voucherStatus
      END
    WHERE voucherId = ?
  `;

  const [result] = await pool.execute<ResultSetHeader>(sql, [
    appliedAmount,
    appliedAmount,
    voucherId,
  ]);

  return result;
};

export const insertSalesVoucher = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: Pick<
    SalesVoucher,
    "salesId" | "voucherId" | "storeId" | "salesVoucherAmount" | "salesVoucherCreatedBy"
  >[];
}) => {
  if (data.length === 0) return;

  const pool = connection ? connection : await getDBConnection();

  const sql = `
    INSERT INTO SalesVoucher (
      salesId, voucherId, storeId, salesVoucherAmount, salesVoucherCreatedBy
    ) VALUES ${data.map(() => "(?, ?, ?, ?, ?)").join(", ")}
  `;

  const values = data.flatMap((d) => [
    d.salesId,
    d.voucherId,
    d.storeId,
    d.salesVoucherAmount,
    d.salesVoucherCreatedBy,
  ]);

  await pool.execute<ResultSetHeader>(sql, values);
};

export const selectSalesVouchersBySalesId = async ({
  connection,
  salesId,
}: {
  connection?: PoolConnection;
  salesId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `
    SELECT sv.*, v.voucherCode, v.voucherName
    FROM SalesVoucher sv
    LEFT JOIN Vouchers v ON v.voucherId = sv.voucherId
    WHERE sv.salesId = ? AND sv.salesVoucherDeletedAt IS NULL
  `;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [salesId]);
  return rows;
};
