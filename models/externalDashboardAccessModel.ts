import { getDBConnection } from "@/lib/db";
import { DisplayExternalDashboardAccess } from "@/types/externalDashboardAccess";
import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

const SELECT_EDA_SQL = `
  SELECT
    eda.*,
    CONCAT_WS(' ', u.userFname, u.userLname) AS edaCreatedByName,
    COALESCE(
      (
        SELECT JSON_ARRAYAGG(edas.storeId)
        FROM ExternalDashboardAccessStore edas
        WHERE edas.edaId = eda.edaId
      ),
      JSON_ARRAY()
    ) AS storeIds,
    COALESCE(
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'storeId', edas.storeId,
          'edasSalesEnabled', edas.edasSalesEnabled,
          'edasInstallmentEnabled', edas.edasInstallmentEnabled
        ))
        FROM ExternalDashboardAccessStore edas
        WHERE edas.edaId = eda.edaId
      ),
      JSON_ARRAY()
    ) AS storeAccess
  FROM ExternalDashboardAccess eda
  LEFT JOIN Users u ON u.userId = eda.edaCreatedBy
`;

export const insertExternalDashboardAccess = async ({
  connection,
  userId,
  edaIsAllStores,
  edaTokenHash,
  edaCreatedBy,
}: {
  connection?: PoolConnection;
  userId: number;
  edaIsAllStores: boolean;
  edaTokenHash: string;
  edaCreatedBy: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `
    INSERT INTO ExternalDashboardAccess (
      userId, edaIsAllStores, edaTokenHash, edaStatus, edaCreatedBy
    ) VALUES (?, ?, ?, 'active', ?)
  `;

  const [result] = await pool.execute<ResultSetHeader>(sql, [
    userId,
    edaIsAllStores ? 1 : 0,
    edaTokenHash,
    edaCreatedBy,
  ]);

  return result;
};

export const insertExternalDashboardAccessStores = async ({
  connection,
  edaId,
  storeAccess,
}: {
  connection?: PoolConnection;
  edaId: number;
  storeAccess: {
    storeId: number;
    edasSalesEnabled: boolean;
    edasInstallmentEnabled: boolean;
  }[];
}) => {
  if (storeAccess.length === 0) return;

  const pool = connection ? connection : await getDBConnection();

  const sql = `
    INSERT INTO ExternalDashboardAccessStore (edaId, storeId, edasSalesEnabled, edasInstallmentEnabled)
    VALUES ${storeAccess.map(() => "(?, ?, ?, ?)").join(", ")}
  `;

  const values = storeAccess.flatMap((s) => [
    edaId,
    s.storeId,
    s.edasSalesEnabled ? 1 : 0,
    s.edasInstallmentEnabled ? 1 : 0,
  ]);

  await pool.execute<ResultSetHeader>(sql, values);
};

export const deleteExternalDashboardAccessStoresByEdaId = async ({
  connection,
  edaId,
}: {
  connection?: PoolConnection;
  edaId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  await pool.execute<ResultSetHeader>(
    `DELETE FROM ExternalDashboardAccessStore WHERE edaId = ?`,
    [edaId],
  );
};

export const selectExternalDashboardAccessByUserId = async ({
  connection,
  userId,
}: {
  connection?: PoolConnection;
  userId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `${SELECT_EDA_SQL} WHERE eda.userId = ?`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [userId]);
  return (rows as DisplayExternalDashboardAccess[])[0] ?? null;
};

export const selectExternalDashboardAccessByTokenHash = async ({
  connection,
  edaTokenHash,
}: {
  connection?: PoolConnection;
  edaTokenHash: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `${SELECT_EDA_SQL} WHERE eda.edaTokenHash = ? AND eda.edaStatus = 'active'`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [edaTokenHash]);
  return (rows as DisplayExternalDashboardAccess[])[0] ?? null;
};

export const touchExternalDashboardAccessLastAccessed = async ({
  connection,
  edaId,
}: {
  connection?: PoolConnection;
  edaId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  await pool.execute<ResultSetHeader>(
    `UPDATE ExternalDashboardAccess SET edaLastAccessedAt = CURRENT_TIMESTAMP WHERE edaId = ?`,
    [edaId],
  );
};

export const selectExternalDashboardAccessById = async ({
  connection,
  edaId,
}: {
  connection?: PoolConnection;
  edaId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `${SELECT_EDA_SQL} WHERE eda.edaId = ?`;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [edaId]);
  return (rows as DisplayExternalDashboardAccess[])[0] ?? null;
};

export const updateExternalDashboardAccessScope = async ({
  connection,
  edaId,
  edaIsAllStores,
}: {
  connection?: PoolConnection;
  edaId: number;
  edaIsAllStores: boolean;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE ExternalDashboardAccess SET edaIsAllStores = ? WHERE edaId = ?`,
    [edaIsAllStores ? 1 : 0, edaId],
  );

  return result;
};

export const updateExternalDashboardAccessStatus = async ({
  connection,
  edaId,
  edaStatus,
}: {
  connection?: PoolConnection;
  edaId: number;
  edaStatus: "active" | "revoked";
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql =
    edaStatus === "revoked"
      ? `UPDATE ExternalDashboardAccess SET edaStatus = ?, edaRevokedAt = CURRENT_TIMESTAMP WHERE edaId = ?`
      : `UPDATE ExternalDashboardAccess SET edaStatus = ?, edaRevokedAt = NULL WHERE edaId = ?`;

  const [result] = await pool.execute<ResultSetHeader>(sql, [
    edaStatus,
    edaId,
  ]);

  return result;
};

export const updateExternalDashboardAccessToken = async ({
  connection,
  edaId,
  edaTokenHash,
}: {
  connection?: PoolConnection;
  edaId: number;
  edaTokenHash: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE ExternalDashboardAccess SET edaTokenHash = ? WHERE edaId = ?`,
    [edaTokenHash, edaId],
  );

  return result;
};
