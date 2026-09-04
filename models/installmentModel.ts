import { getDBConnection } from "@/lib/db";
import {
  CreateInstallmentCheckDto,
  CreateInstallmentDto,
  UpdateInstallmentCheckDto,
} from "@/dtos/installment.dto";
import {
  InstallmentCollectionTrendPoint,
  InstallmentStatusBreakdown,
  InstallmentSummary,
  InstallmentSummaryExtended,
  TopOutstandingCustomer,
  UpcomingCheck,
} from "@/types/installments";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const selectCountInstallments = async ({
  connection,
  storeId,
  search,
}: {
  connection?: PoolConnection;
  storeId: number;
  search?: string;
}): Promise<number> => {
  const pool = connection ?? (await getDBConnection());

  let sql = `
    SELECT COUNT(*) as total
    FROM Installments i
    INNER JOIN Customers c ON c.customerId = i.customerId
    WHERE i.storeId = ? AND i.installmentDeletedAt IS NULL
  `;
  const params: any[] = [storeId];

  if (search?.trim()) {
    sql += ` AND (i.installmentNo LIKE ? OR i.installmentClientCode LIKE ? OR c.customerName LIKE ?)`;
    const wildcard = `%${search.trim()}%`;
    params.push(wildcard, wildcard, wildcard);
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return Number((rows as any)[0]?.total ?? 0);
};

export const insertInstallment = async ({
  connection,
  data,
  installmentNo,
}: {
  connection: PoolConnection;
  data: CreateInstallmentDto;
  installmentNo: string;
}) => {
  const sql = `
    INSERT INTO Installments(
      installmentNo, installmentClientCode, installmentDescription,
      installmentTotalMonthsPlan, installmentTotalAmount, installmentStartDate,
      installmentEwtRate, installmentNotes, installmentCreatedBy, customerId, storeId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    installmentNo,
    data.installmentClientCode,
    data.installmentDescription,
    data.installmentTotalMonthsPlan,
    data.installmentTotalAmount,
    data.installmentStartDate,
    data.installmentEwtRate ?? null,
    data.installmentNotes ?? null,
    data.installmentCreatedBy,
    data.customerId,
    data.storeId,
  ];

  const [result] = await connection.execute<ResultSetHeader>(sql, values);
  return result.insertId;
};

export const insertInstallmentChecks = async ({
  connection,
  installmentId,
  checks,
}: {
  connection: PoolConnection;
  installmentId: number;
  checks: CreateInstallmentCheckDto[];
}) => {
  if (!checks || checks.length === 0) {
    throw new Error("No installment checks provided");
  }

  const sql = `
    INSERT INTO InstallmentChecks(
      installmentCheckSequenceNo, installmentCheckNo, installmentCheckDate,
      installmentCheckGrossAmount, installmentCheckEwtWithheld, installmentCheckNetAmount,
      installmentCheckNotes, installmentId
    ) VALUES ${checks.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ")}
  `;
  const values = checks.flatMap((check) => [
    check.installmentCheckSequenceNo,
    check.installmentCheckNo ?? null,
    check.installmentCheckDate,
    check.installmentCheckGrossAmount,
    check.installmentCheckEwtWithheld ?? 0,
    check.installmentCheckNetAmount,
    check.installmentCheckNotes ?? null,
    installmentId,
  ]);

  await connection.execute<ResultSetHeader>(sql, values);
};

const installmentListSelect = `
  SELECT
    i.*,
    c.customerName,
    CONCAT_WS(' ', u.userFname, u.userLname) AS installmentCreatedByName,
    (SELECT COUNT(*) FROM InstallmentChecks ic WHERE ic.installmentId = i.installmentId) AS totalChecks,
    (SELECT COUNT(*) FROM InstallmentChecks ic WHERE ic.installmentId = i.installmentId AND ic.installmentCheckStatus = 'deposited') AS depositedChecks,
    (SELECT COALESCE(SUM(ic.installmentCheckGrossAmount), 0) FROM InstallmentChecks ic WHERE ic.installmentId = i.installmentId AND ic.installmentCheckStatus = 'deposited') AS depositedAmount,
    (SELECT COALESCE(SUM(ic.installmentCheckGrossAmount), 0) FROM InstallmentChecks ic WHERE ic.installmentId = i.installmentId AND ic.installmentCheckStatus = 'pending') AS pendingAmount,
    (SELECT MAX(ic.installmentCheckDepositedDate) FROM InstallmentChecks ic WHERE ic.installmentId = i.installmentId AND ic.installmentCheckStatus = 'deposited') AS lastDepositedDate,
    (SELECT MIN(ic.installmentCheckDate) FROM InstallmentChecks ic WHERE ic.installmentId = i.installmentId AND ic.installmentCheckStatus = 'pending') AS nextDueDate
  FROM Installments i
  INNER JOIN Customers c ON c.customerId = i.customerId
  INNER JOIN Users u ON u.userId = i.installmentCreatedBy
`;

export const selectInstallments = async ({
  connection,
  storeId,
  search,
  limit,
  offset,
}: {
  connection?: PoolConnection;
  storeId: number;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const pool = connection ?? (await getDBConnection());

  let sql = `${installmentListSelect} WHERE i.storeId = ? AND i.installmentDeletedAt IS NULL`;
  const params: any[] = [storeId];

  if (search?.trim()) {
    sql += ` AND (i.installmentNo LIKE ? OR i.installmentClientCode LIKE ? OR c.customerName LIKE ?)`;
    const wildcard = `%${search.trim()}%`;
    params.push(wildcard, wildcard, wildcard);
  }

  sql += ` ORDER BY i.installmentCreatedAt DESC`;

  if (limit !== undefined) {
    const safeLimit = Math.max(1, Math.floor(Number(limit)));
    const safeOffset = Math.max(0, Math.floor(Number(offset ?? 0)));
    sql += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const selectInstallmentsForStores = async ({
  connection,
  storeIds,
  search,
  limit,
  offset,
}: {
  connection?: PoolConnection;
  storeIds: number[];
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  if (storeIds.length === 0) return [];

  const pool = connection ?? (await getDBConnection());
  const placeholders = storeIds.map(() => "?").join(",");

  let sql = `${installmentListSelect} WHERE i.storeId IN (${placeholders}) AND i.installmentDeletedAt IS NULL`;
  const params: any[] = [...storeIds];

  if (search?.trim()) {
    sql += ` AND (i.installmentNo LIKE ? OR i.installmentClientCode LIKE ? OR c.customerName LIKE ?)`;
    const wildcard = `%${search.trim()}%`;
    params.push(wildcard, wildcard, wildcard);
  }

  sql += ` ORDER BY i.installmentCreatedAt DESC`;

  if (limit !== undefined) {
    const safeLimit = Math.max(1, Math.floor(Number(limit)));
    const safeOffset = Math.max(0, Math.floor(Number(offset ?? 0)));
    sql += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const selectCountInstallmentsForStores = async ({
  connection,
  storeIds,
  search,
}: {
  connection?: PoolConnection;
  storeIds: number[];
  search?: string;
}): Promise<number> => {
  if (storeIds.length === 0) return 0;

  const pool = connection ?? (await getDBConnection());
  const placeholders = storeIds.map(() => "?").join(",");

  let sql = `
    SELECT COUNT(*) as total
    FROM Installments i
    INNER JOIN Customers c ON c.customerId = i.customerId
    WHERE i.storeId IN (${placeholders}) AND i.installmentDeletedAt IS NULL
  `;
  const params: any[] = [...storeIds];

  if (search?.trim()) {
    sql += ` AND (i.installmentNo LIKE ? OR i.installmentClientCode LIKE ? OR c.customerName LIKE ?)`;
    const wildcard = `%${search.trim()}%`;
    params.push(wildcard, wildcard, wildcard);
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return Number((rows as any)[0]?.total ?? 0);
};

export const selectInstallmentById = async ({
  connection,
  installmentId,
  storeId,
}: {
  connection?: PoolConnection;
  installmentId: number;
  storeId?: number;
}) => {
  const pool = connection ?? (await getDBConnection());

  let sql = `${installmentListSelect} WHERE i.installmentId = ? AND i.installmentDeletedAt IS NULL`;
  const params: any[] = [installmentId];

  if (storeId !== undefined) {
    sql += ` AND i.storeId = ?`;
    params.push(storeId);
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows[0] ?? null;
};

export const selectInstallmentChecksByInstallmentId = async ({
  connection,
  installmentId,
}: {
  connection?: PoolConnection;
  installmentId: number;
}) => {
  const pool = connection ?? (await getDBConnection());

  const sql = `
    SELECT ic.*, CONCAT_WS(' ', u.userFname, u.userLname) AS installmentCheckDepositedByName
    FROM InstallmentChecks ic
    LEFT JOIN Users u ON u.userId = ic.installmentCheckDepositedBy
    WHERE ic.installmentId = ?
    ORDER BY ic.installmentCheckSequenceNo ASC
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [installmentId]);
  return rows;
};

export const selectInstallmentCheckOwnership = async ({
  connection,
  installmentCheckId,
}: {
  connection?: PoolConnection;
  installmentCheckId: number;
}): Promise<{ installmentId: number; storeId: number } | null> => {
  const pool = connection ?? (await getDBConnection());

  const sql = `
    SELECT ic.installmentId, i.storeId
    FROM InstallmentChecks ic
    INNER JOIN Installments i ON i.installmentId = ic.installmentId
    WHERE ic.installmentCheckId = ?
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [installmentCheckId]);
  const row = rows[0] as any;
  return row
    ? { installmentId: row.installmentId, storeId: row.storeId }
    : null;
};

export const updateInstallmentCheck = async ({
  connection,
  installmentCheckId,
  data,
}: {
  connection?: PoolConnection;
  installmentCheckId: number;
  data: UpdateInstallmentCheckDto;
}) => {
  const pool = connection ?? (await getDBConnection());

  const fields: string[] = [];
  const params: any[] = [];

  if (data.installmentCheckStatus !== undefined) {
    fields.push("installmentCheckStatus = ?");
    params.push(data.installmentCheckStatus);
  }
  if (data.installmentCheckDepositedDate !== undefined) {
    fields.push("installmentCheckDepositedDate = ?");
    params.push(data.installmentCheckDepositedDate);
  }
  if (data.installmentCheckNo !== undefined) {
    fields.push("installmentCheckNo = ?");
    params.push(data.installmentCheckNo);
  }
  if (data.installmentCheckNotes !== undefined) {
    fields.push("installmentCheckNotes = ?");
    params.push(data.installmentCheckNotes);
  }
  if (data.installmentCheckDepositedBy !== undefined) {
    fields.push("installmentCheckDepositedBy = ?");
    params.push(data.installmentCheckDepositedBy);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  const sql = `UPDATE InstallmentChecks SET ${fields.join(", ")} WHERE installmentCheckId = ?`;
  params.push(installmentCheckId);

  await pool.execute<ResultSetHeader>(sql, params);
};

export const selectInstallmentChecksAllDeposited = async ({
  connection,
  installmentId,
}: {
  connection?: PoolConnection;
  installmentId: number;
}): Promise<boolean> => {
  const pool = connection ?? (await getDBConnection());

  const sql = `
    SELECT COUNT(*) as pendingCount
    FROM InstallmentChecks
    WHERE installmentId = ? AND installmentCheckStatus NOT IN ('deposited', 'cancelled')
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [installmentId]);
  return Number((rows as any)[0]?.pendingCount ?? 0) === 0;
};

export const updateInstallmentStatus = async ({
  connection,
  installmentId,
  installmentStatus,
}: {
  connection?: PoolConnection;
  installmentId: number;
  installmentStatus: "active" | "completed" | "cancelled" | "defaulted";
}) => {
  const pool = connection ?? (await getDBConnection());

  await pool.execute<ResultSetHeader>(
    `UPDATE Installments SET installmentStatus = ? WHERE installmentId = ?`,
    [installmentStatus, installmentId],
  );
};

export const selectInstallmentSummary = async ({
  connection,
  storeId,
}: {
  connection?: PoolConnection;
  storeId: number;
}): Promise<InstallmentSummary> => {
  const pool = connection ?? (await getDBConnection());

  const sql = `
    SELECT
      (SELECT COUNT(*) FROM Installments
        WHERE storeId = ? AND installmentDeletedAt IS NULL) AS totalPlans,
      (SELECT COUNT(*) FROM Installments
        WHERE storeId = ? AND installmentDeletedAt IS NULL AND installmentStatus = 'active') AS activePlans,
      (SELECT COALESCE(SUM(installmentTotalAmount), 0) FROM Installments
        WHERE storeId = ? AND installmentDeletedAt IS NULL) AS totalPortfolio,
      (SELECT COALESCE(SUM(ic.installmentCheckGrossAmount), 0)
        FROM InstallmentChecks ic
        INNER JOIN Installments i ON i.installmentId = ic.installmentId
        WHERE i.storeId = ? AND i.installmentDeletedAt IS NULL
          AND ic.installmentCheckStatus = 'deposited') AS totalCollected,
      (SELECT COALESCE(SUM(ic.installmentCheckGrossAmount), 0)
        FROM InstallmentChecks ic
        INNER JOIN Installments i ON i.installmentId = ic.installmentId
        WHERE i.storeId = ? AND i.installmentDeletedAt IS NULL
          AND ic.installmentCheckStatus = 'pending') AS totalOutstanding,
      (SELECT COUNT(*)
        FROM InstallmentChecks ic
        INNER JOIN Installments i ON i.installmentId = ic.installmentId
        WHERE i.storeId = ? AND i.installmentDeletedAt IS NULL
          AND ic.installmentCheckStatus = 'pending'
          AND ic.installmentCheckDate = CURDATE()) AS checksDueToday
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(
    sql,
    Array(6).fill(storeId),
  );
  const row = rows[0] as any;

  return {
    totalPlans: Number(row.totalPlans ?? 0),
    activePlans: Number(row.activePlans ?? 0),
    totalPortfolio: Number(row.totalPortfolio ?? 0),
    totalCollected: Number(row.totalCollected ?? 0),
    totalOutstanding: Number(row.totalOutstanding ?? 0),
    checksDueToday: Number(row.checksDueToday ?? 0),
  };
};

// Same shape as selectInstallmentSummary, but across a set of stores at
// once - for the external dashboard's company-wide tile, which has no
// single storeId to scope to (a grant can cover several stores).
export const selectInstallmentSummaryForStores = async ({
  connection,
  storeIds,
}: {
  connection?: PoolConnection;
  storeIds: number[];
}): Promise<InstallmentSummaryExtended> => {
  if (storeIds.length === 0) {
    return {
      totalPlans: 0,
      activePlans: 0,
      totalPortfolio: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      checksDueToday: 0,
      overdueChecks: 0,
      checksDueThisWeek: 0,
    };
  }

  const pool = connection ?? (await getDBConnection());
  const placeholders = storeIds.map(() => "?").join(",");

  const sql = `
    SELECT
      (SELECT COUNT(*) FROM Installments
        WHERE storeId IN (${placeholders}) AND installmentDeletedAt IS NULL) AS totalPlans,
      (SELECT COUNT(*) FROM Installments
        WHERE storeId IN (${placeholders}) AND installmentDeletedAt IS NULL AND installmentStatus = 'active') AS activePlans,
      (SELECT COALESCE(SUM(installmentTotalAmount), 0) FROM Installments
        WHERE storeId IN (${placeholders}) AND installmentDeletedAt IS NULL) AS totalPortfolio,
      (SELECT COALESCE(SUM(ic.installmentCheckGrossAmount), 0)
        FROM InstallmentChecks ic
        INNER JOIN Installments i ON i.installmentId = ic.installmentId
        WHERE i.storeId IN (${placeholders}) AND i.installmentDeletedAt IS NULL
          AND ic.installmentCheckStatus = 'deposited') AS totalCollected,
      (SELECT COALESCE(SUM(ic.installmentCheckGrossAmount), 0)
        FROM InstallmentChecks ic
        INNER JOIN Installments i ON i.installmentId = ic.installmentId
        WHERE i.storeId IN (${placeholders}) AND i.installmentDeletedAt IS NULL
          AND ic.installmentCheckStatus = 'pending') AS totalOutstanding,
      (SELECT COUNT(*)
        FROM InstallmentChecks ic
        INNER JOIN Installments i ON i.installmentId = ic.installmentId
        WHERE i.storeId IN (${placeholders}) AND i.installmentDeletedAt IS NULL
          AND ic.installmentCheckStatus = 'pending'
          AND ic.installmentCheckDate = CURDATE()) AS checksDueToday,
      (SELECT COUNT(*)
        FROM InstallmentChecks ic
        INNER JOIN Installments i ON i.installmentId = ic.installmentId
        WHERE i.storeId IN (${placeholders}) AND i.installmentDeletedAt IS NULL
          AND ic.installmentCheckStatus = 'pending'
          AND ic.installmentCheckDate < CURDATE()) AS overdueChecks,
      (SELECT COUNT(*)
        FROM InstallmentChecks ic
        INNER JOIN Installments i ON i.installmentId = ic.installmentId
        WHERE i.storeId IN (${placeholders}) AND i.installmentDeletedAt IS NULL
          AND ic.installmentCheckStatus = 'pending'
          AND ic.installmentCheckDate > CURDATE()
          AND ic.installmentCheckDate <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS checksDueThisWeek
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(
    sql,
    Array(8).fill(storeIds).flat(),
  );
  const row = rows[0] as any;

  return {
    totalPlans: Number(row.totalPlans ?? 0),
    activePlans: Number(row.activePlans ?? 0),
    totalPortfolio: Number(row.totalPortfolio ?? 0),
    totalCollected: Number(row.totalCollected ?? 0),
    totalOutstanding: Number(row.totalOutstanding ?? 0),
    checksDueToday: Number(row.checksDueToday ?? 0),
    overdueChecks: Number(row.overdueChecks ?? 0),
    checksDueThisWeek: Number(row.checksDueThisWeek ?? 0),
  };
};

// Monthly totals of deposited check amounts across a set of stores, for the
// external dashboard's collection trend chart. Only months with at least one
// deposit come back - the caller fills in zero for any gap month.
export const selectInstallmentCollectionTrendForStores = async ({
  connection,
  storeIds,
  months = 6,
}: {
  connection?: PoolConnection;
  storeIds: number[];
  months?: number;
}): Promise<InstallmentCollectionTrendPoint[]> => {
  if (storeIds.length === 0) return [];

  const pool = connection ?? (await getDBConnection());
  const placeholders = storeIds.map(() => "?").join(",");
  const safeMonths = Math.max(1, Math.floor(Number(months)));

  const sql = `
    SELECT
      DATE_FORMAT(ic.installmentCheckDepositedDate, '%Y-%m') AS period,
      COALESCE(SUM(ic.installmentCheckGrossAmount), 0) AS collectedAmount
    FROM InstallmentChecks ic
    INNER JOIN Installments i ON i.installmentId = ic.installmentId
    WHERE i.storeId IN (${placeholders})
      AND i.installmentDeletedAt IS NULL
      AND ic.installmentCheckStatus = 'deposited'
      AND ic.installmentCheckDepositedDate >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ${safeMonths - 1} MONTH)
    GROUP BY period
    ORDER BY period ASC
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, storeIds);

  return (rows as any[]).map((row) => ({
    period: String(row.period),
    collectedAmount: Number(row.collectedAmount ?? 0),
  }));
};

// Pending (not yet deposited) checks across a set of stores, soonest due
// first - overdue ones sort to the front since their date is furthest in
// the past. The caller derives an overdue/due-today/upcoming label from
// installmentCheckDate vs. today rather than storing that as state.
export const selectUpcomingChecksForStores = async ({
  connection,
  storeIds,
  limit = 5,
  offset = 0,
}: {
  connection?: PoolConnection;
  storeIds: number[];
  limit?: number;
  offset?: number;
}): Promise<UpcomingCheck[]> => {
  if (storeIds.length === 0) return [];

  const pool = connection ?? (await getDBConnection());
  const placeholders = storeIds.map(() => "?").join(",");
  const safeLimit = Math.max(1, Math.floor(Number(limit)));
  const safeOffset = Math.max(0, Math.floor(Number(offset)));

  const sql = `
    SELECT
      ic.installmentCheckId, ic.installmentCheckNo, ic.installmentCheckDate,
      ic.installmentCheckGrossAmount, ic.installmentCheckStatus,
      ic.installmentCheckSequenceNo, i.installmentTotalMonthsPlan,
      c.customerName, i.installmentId, i.installmentNo, i.storeId
    FROM InstallmentChecks ic
    INNER JOIN Installments i ON i.installmentId = ic.installmentId
    INNER JOIN Customers c ON c.customerId = i.customerId
    WHERE i.storeId IN (${placeholders})
      AND i.installmentDeletedAt IS NULL
      AND i.installmentStatus = 'active'
      AND ic.installmentCheckStatus = 'pending'
    ORDER BY ic.installmentCheckDate ASC
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, storeIds);

  return rows as unknown as UpcomingCheck[];
};

export const selectCountUpcomingChecksForStores = async ({
  connection,
  storeIds,
}: {
  connection?: PoolConnection;
  storeIds: number[];
}): Promise<number> => {
  if (storeIds.length === 0) return 0;

  const pool = connection ?? (await getDBConnection());
  const placeholders = storeIds.map(() => "?").join(",");

  const sql = `
    SELECT COUNT(*) AS total
    FROM InstallmentChecks ic
    INNER JOIN Installments i ON i.installmentId = ic.installmentId
    WHERE i.storeId IN (${placeholders})
      AND i.installmentDeletedAt IS NULL
      AND i.installmentStatus = 'active'
      AND ic.installmentCheckStatus = 'pending'
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, storeIds);

  return Number((rows[0] as any)?.total ?? 0);
};

export const selectInstallmentStatusBreakdownForStores = async ({
  connection,
  storeIds,
}: {
  connection?: PoolConnection;
  storeIds: number[];
}): Promise<InstallmentStatusBreakdown[]> => {
  if (storeIds.length === 0) return [];

  const pool = connection ?? (await getDBConnection());
  const placeholders = storeIds.map(() => "?").join(",");

  const sql = `
    SELECT
      installmentStatus AS status,
      COUNT(*) AS count,
      COALESCE(SUM(installmentTotalAmount), 0) AS totalAmount
    FROM Installments
    WHERE storeId IN (${placeholders}) AND installmentDeletedAt IS NULL
    GROUP BY installmentStatus
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, storeIds);

  return (rows as any[]).map((row) => ({
    status: row.status,
    count: Number(row.count ?? 0),
    totalAmount: Number(row.totalAmount ?? 0),
  }));
};

// Active plans only, ranked by how much is still owed - a defaulted or
// cancelled plan's remaining checks aren't really "outstanding" in the
// collections-follow-up sense this list is for.
export const selectTopOutstandingCustomersForStores = async ({
  connection,
  storeIds,
  limit = 5,
}: {
  connection?: PoolConnection;
  storeIds: number[];
  limit?: number;
}): Promise<TopOutstandingCustomer[]> => {
  if (storeIds.length === 0) return [];

  const pool = connection ?? (await getDBConnection());
  const placeholders = storeIds.map(() => "?").join(",");
  const safeLimit = Math.max(1, Math.floor(Number(limit)));

  const sql = `
    SELECT t.* FROM (
      SELECT
        i.installmentId, i.installmentNo, i.storeId, c.customerName,
        i.installmentTotalMonthsPlan,
        COALESCE(
          (SELECT SUM(ic.installmentCheckGrossAmount)
            FROM InstallmentChecks ic
            WHERE ic.installmentId = i.installmentId
              AND ic.installmentCheckStatus = 'pending'),
          0
        ) AS pendingAmount,
        (SELECT COUNT(*)
          FROM InstallmentChecks ic
          WHERE ic.installmentId = i.installmentId
            AND ic.installmentCheckStatus = 'deposited'
        ) AS depositedChecks
      FROM Installments i
      INNER JOIN Customers c ON c.customerId = i.customerId
      WHERE i.storeId IN (${placeholders})
        AND i.installmentDeletedAt IS NULL
        AND i.installmentStatus = 'active'
    ) t
    WHERE t.pendingAmount > 0
    ORDER BY t.pendingAmount DESC
    LIMIT ${safeLimit}
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, storeIds);

  return rows as unknown as TopOutstandingCustomer[];
};
