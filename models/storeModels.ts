import { CreateStoreDto, CreateStoreEmployeeDto } from "@/dtos/store.dto";
import { getDBConnection } from "../lib/db";
import { skip } from "node:test";
import {
  PoolClusterOptions,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { EmployeeInterface } from "@/types/employees";
import { InventoryInterface } from "@/types/inventory";
import { StoreInterface } from "@/types/stores";
import { join } from "path";

export const insertStore = async ({
  data,
  connection,
}: {
  data: CreateStoreDto;
  connection: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Stores(storeName,storeLocation,storeDescription,storeCreatedBy,companyId) VALUES(?,?,?,?,?)`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.storeName,
    data.storeLocation,
    data.storeDescription,
    data.storeCreatedBy,
    data.companyId ?? null,
  ]);
  return result.insertId;
};

// Resolves a store's owning company straight from the DB - never trust a
// client-supplied companyId, only the storeId (which itself still has to
// be cross-checked against the acting user's own companyId by the caller).
export const selectStoreCompanyId = async (storeId: number) => {
  const pool = await getDBConnection();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT companyId FROM Stores WHERE storeId = ?`,
    [storeId],
  );
  return (rows[0]?.companyId as number | undefined) ?? null;
};

// Lean, dedicated lookup (mirrors selectStoreCompanyId) - the POS
// sale-creation route only needs this one flag, not the full Store row.
export const selectStoreSalesApprovalEnabled = async (storeId: number) => {
  const pool = await getDBConnection();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT storeSalesApprovalEnabled FROM Stores WHERE storeId = ?`,
    [storeId],
  );
  return !!rows[0]?.storeSalesApprovalEnabled;
};

// Lean, dedicated lookup (mirrors selectStoreCompanyId) - fetches the
// current banner filename before it's overwritten/cleared, so the old
// Nextcloud file can be deleted instead of orphaned.
export const selectStoreKioskBannerImage = async (storeId: number) => {
  const pool = await getDBConnection();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT storeKioskBannerImage FROM Stores WHERE storeId = ?`,
    [storeId],
  );
  return (rows[0]?.storeKioskBannerImage as string | undefined) ?? null;
};

// All storeIds belonging to one company - used to scope aggregate
// queries (dashboards, etc.) that otherwise only accept a single storeId.
export const selectStoreIdsByCompanyId = async (companyId: number) => {
  const pool = await getDBConnection();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT storeId FROM Stores WHERE companyId = ?`,
    [companyId],
  );
  return rows.map((r) => r.storeId as number);
};

export const selectStores = async ({
  search,
  limit,
  skip,
  keyfields = {},
}: {
  search?: string;
  limit?: number;
  skip?: number;
  keyfields?: Partial<StoreInterface>;
}) => {
  const pool = await getDBConnection();

  const params: any[] = [];
  // companyInstallmentEnabled (not a Stores column) rides along so callers
  // can gate storeInstallmentEnabled's toggle by the company's entitlement
  // without a second round trip.
  let sql = `
    SELECT s.*, c.companyInstallmentEnabled
    FROM Stores s
    LEFT JOIN Companies c ON c.companyId = s.companyId
    WHERE 1=1`;
  for (const [key, value] of Object.entries(keyfields)) {
    if (value === undefined) continue;

    if (value === null) {
      sql += ` AND s.${key} IS NULL`;
    } else if (key === "storeName") {
      sql += ` AND TRIM(s.storeName) = TRIM(?)`;
      params.push(value);
    } else {
      sql += ` AND s.${key} = ?`;
      params.push(value);
    }
  }
  if (search) {
    const wildcard = `%${search}%`;
    sql += ` AND TRIM(s.storeName) LIKE ?`;
    params.push(wildcard);
  }

  if (limit) {
    sql += ` LIMIT ${limit}`;
  }

  if (skip) {
    sql += ` OFFSET ${skip}`;
  }

  const [rows] = await pool.execute(sql, params);
  return rows;
};

export const updateStoreFeatures = async ({
  storeId,
  storeKioskEnabled,
  storeOrderEnabled,
  storeKioskBannerImage,
  storeSalesApprovalEnabled,
  storeInstallmentEnabled,
}: {
  storeId: number;
  storeKioskEnabled?: boolean;
  storeOrderEnabled?: boolean;
  storeKioskBannerImage?: string | null;
  storeSalesApprovalEnabled?: boolean;
  storeInstallmentEnabled?: boolean;
}) => {
  const pool = await getDBConnection();
  const setClauses: string[] = [];
  const params: any[] = [];

  if (storeKioskEnabled !== undefined) {
    setClauses.push("storeKioskEnabled = ?");
    params.push(storeKioskEnabled ? 1 : 0);
  }

  if (storeOrderEnabled !== undefined) {
    setClauses.push("storeOrderEnabled = ?");
    params.push(storeOrderEnabled ? 1 : 0);
  }

  if (storeKioskBannerImage !== undefined) {
    setClauses.push("storeKioskBannerImage = ?");
    params.push(storeKioskBannerImage);
  }

  if (storeSalesApprovalEnabled !== undefined) {
    setClauses.push("storeSalesApprovalEnabled = ?");
    params.push(storeSalesApprovalEnabled ? 1 : 0);
  }

  if (storeInstallmentEnabled !== undefined) {
    setClauses.push("storeInstallmentEnabled = ?");
    params.push(storeInstallmentEnabled ? 1 : 0);
  }

  if (setClauses.length === 0) return;

  params.push(storeId);

  const sql = `UPDATE Stores SET ${setClauses.join(", ")} WHERE storeId = ?`;
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
};

export const selectStoresByEmpKeyFields = async ({
  keyFields = {},
}: {
  keyFields?: Partial<EmployeeInterface>;
}) => {
  const pool = await getDBConnection();
  let sql = `SELECT s.* FROM Stores s
LEFT JOIN Employees e ON e.storeId = s.storeId
WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND e.${key} IS NULL`;
    } else {
      sql += ` AND e.${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows;
};

// export selectStoresByUserId

export const selectStoresByPoId = async (poId: number) => {
  const pool = await getDBConnection();

  const sql = `
  SELECT * FROM Stores s
  LEFT JOIN RequestOrders ro ON ro.storeId = s.storeId
  LEFT JOIN PurchaseOrderRequest por ON por.requestId = ro.requestId
  LEFT JOIN PurchaseOrders po ON po.poId = por.poId
  WHERE po.poId = ?`;
  const [rows] = await pool.execute(sql, [poId]);
  return rows;
};

export const selectStoresByInventoryKeyFields = async ({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryInterface>;
}) => {
  const pool = await getDBConnection();
  let sql = `SELECT s.* FROM Stores s 
LEFT JOIN Inventories i ON i.inventoryReferenceId = s.storeId AND i.inventoryReference = 'store'
WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND i.${key} IS NULL`;
    } else {
      sql += ` AND i.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as StoreInterface[];
};

export const insertStoreEmployees = async ({
  data,
  connection,
}: {
  data?: CreateStoreEmployeeDto[];
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  try {
    const sql = `INSERT INTO StoreEmployees(storeId,empId,storeEmpCreatedBy) VALUES ${
      data?.map(() => "(?, ?,?)").join(", ") || ""
    }`;
    const values = data?.flatMap((item) => [
      item.storeId,
      item.empId,
      item.storeEmpCreatedBy,
    ]);

    const [results] = await pool.execute(sql, values);
    return results;
  } catch (e) {
    throw e;
  }
};

export const selectStoreEmployee = async ({
  connection,
  keyFields,
}: {
  connection?: PoolConnection;
  keyFields: Partial<EmployeeInterface>;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT s.* FROM StoreEmployees se 
  LEFT JOIN Stores s ON s.storeId = se.storeId
  LEFT JOIN Employees e ON e.empId = se.empId
  LEFT JOIN Users u ON u.userId = e.userId
  WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND e.${key} IS NULL`;
    } else {
      sql += ` AND e.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as StoreInterface[];
};

export const selectStoreEmployeeDetails = async ({
  connection,
  keyFields,
}: {
  connection?: PoolConnection;
  keyFields: Partial<EmployeeInterface>;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `
  SELECT se.*,CONCAT(u.userName,' ',u.userLname) AS 'name',e.empPosition,e.empId,u.userRole,u.userEmail,e.*  FROM StoreEmployees se 
  LEFT JOIN Stores s ON s.storeId = se.storeId
  LEFT JOIN Employees e ON e.empId = se.empId
  LEFT JOIN Users u ON u.userId = e.userId
  WHERE 1=1
  
  `;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND se.${key} IS NULL`;
    } else {
      sql += ` AND se.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as StoreInterface[];
};

export const selectStoreSales = async ({
  from,
  to,
  notZeroSales = false,
  storeIds,
}: {
  from?: string;
  to?: string;
  notZeroSales?: boolean;
  storeIds?: number[];
}) => {
  const pool = await getDBConnection();

  const params: any[] = [];

  let salesJoin = `LEFT JOIN Sales s ON s.storeId = st.storeId AND s.salesStatus NOT IN ('pending_approval', 'rejected')`;

  if (from && to) {
    salesJoin += ` AND DATE(s.salesCreatedAt) BETWEEN ? AND ?`;
    params.push(from, to);
  }

  let whereClause = "";
  if (storeIds && storeIds.length > 0) {
    whereClause = `WHERE st.storeId IN (${storeIds.map(() => "?").join(",")})`;
    params.push(...storeIds);
  }

  const sql = `
    SELECT
      st.storeId,
      st.storeName,
      COALESCE(
        SUM(s.salesTotalAmount) - COALESCE(SUM(sr.totalRefunds), 0),
        0
      ) AS totalSales
    FROM Stores st
    ${salesJoin}
    LEFT JOIN (
      SELECT salesId, SUM(salesRefAmount) AS totalRefunds
      FROM SalesRefunds
      GROUP BY salesId
    ) sr ON sr.salesId = s.salesId
    ${whereClause}
    GROUP BY st.storeId, st.storeName
     ${notZeroSales ? "HAVING totalSales <> 0" : ""}
  `;

  const [rows] = await pool.execute(sql, params);

  return rows;
};
