import { GrantExternalDashboardAccessDto } from "@/dtos/externalDashboardAccess.dto";
import { getDBConnection } from "@/lib/db";
import {
  deleteExternalDashboardAccessStoresByEdaId,
  insertExternalDashboardAccess,
  insertExternalDashboardAccessStores,
  selectExternalDashboardAccessById,
  selectExternalDashboardAccessByUserId,
  updateExternalDashboardAccessScope,
  updateExternalDashboardAccessStatus,
} from "@/models/externalDashboardAccessModel";
import { generateRawToken, hashToken } from "./token";

// Grants access on first call (generating a brand-new token) or updates the
// store scope on subsequent calls, reactivating a previously revoked grant
// without rotating its token - re-granting isn't the same action as
// deliberately regenerating a leaked/rotated token.
export async function grantOrUpdateExternalDashboardAccess(
  data: GrantExternalDashboardAccessDto,
) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const existing = await selectExternalDashboardAccessByUserId({
      connection,
      userId: data.userId,
    });

    let edaId: number;
    let rawToken: string | null = null;

    if (existing) {
      edaId = existing.edaId;

      await updateExternalDashboardAccessScope({
        connection,
        edaId,
        edaIsAllStores: data.edaIsAllStores,
      });

      if (existing.edaStatus !== "active") {
        await updateExternalDashboardAccessStatus({
          connection,
          edaId,
          edaStatus: "active",
        });
      }

      await deleteExternalDashboardAccessStoresByEdaId({ connection, edaId });
    } else {
      rawToken = generateRawToken();

      const result = await insertExternalDashboardAccess({
        connection,
        userId: data.userId,
        edaIsAllStores: data.edaIsAllStores,
        edaTokenHash: hashToken(rawToken),
        edaCreatedBy: data.edaCreatedBy,
      });

      edaId = result.insertId;
    }

    if (!data.edaIsAllStores && data.storeIds && data.storeIds.length > 0) {
      await insertExternalDashboardAccessStores({
        connection,
        edaId,
        storeIds: data.storeIds,
      });
    }

    const access = await selectExternalDashboardAccessById({
      connection,
      edaId,
    });

    await connection.commit();

    // rawToken is only non-null the first time access is granted for this
    // user - callers must surface it to the admin immediately, it can never
    // be retrieved again afterward.
    return { access, rawToken };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
