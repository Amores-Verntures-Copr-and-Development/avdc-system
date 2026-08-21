import { UpdatePlatformSettingsDto } from "@/dtos/platformSettings.dto";
import { getDBConnection } from "@/lib/db";
import { PlatformSettings } from "@/types/platformSettings";
import { PoolConnection, RowDataPacket } from "mysql2/promise";

// Billing rate is a single platform-wide flat price per store, not a
// per-company plan - so this table only ever has one row (platformSettingId = 1).
export const getPlatformSettings = async ({
  connection,
}: {
  connection?: PoolConnection;
} = {}) => {
  const pool = connection ? connection : await getDBConnection();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM PlatformSettings WHERE platformSettingId = 1`,
  );
  return (rows[0] as PlatformSettings) ?? null;
};

export const updatePlatformSettings = async ({
  connection,
  data,
  updatedBy,
}: {
  connection?: PoolConnection;
  data: UpdatePlatformSettingsDto;
  updatedBy: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `
    UPDATE PlatformSettings
    SET platformSettingPricePerStore = ?, platformSettingUpdatedBy = ?
    WHERE platformSettingId = 1
  `;
  const [result] = await pool.execute(sql, [
    data.platformSettingPricePerStore,
    updatedBy,
  ]);
  return result;
};
