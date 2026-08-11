import { getDBConnection } from "@/lib/db";
import {
  selectExternalDashboardAccessByTokenHash,
  touchExternalDashboardAccessLastAccessed,
} from "@/models/externalDashboardAccessModel";
import { selectUserWithUserId } from "@/models/userModels";
import { hashToken } from "./token";

// Called on every avdc-track login (and can be re-called per data request
// later) - re-validates against the live DB rather than trusting a cached
// result, so a revoke takes effect immediately instead of waiting out a
// cached session.
export async function verifyExternalDashboardToken(rawToken: string) {
  if (!rawToken) {
    throw new Error("No token provided");
  }

  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    const access = await selectExternalDashboardAccessByTokenHash({
      connection,
      edaTokenHash: hashToken(rawToken),
    });

    if (!access) {
      throw new Error("Invalid or revoked token");
    }

    const userRows = await selectUserWithUserId({
      connection,
      userId: access.userId,
    });
    const user = userRows[0];

    await touchExternalDashboardAccessLastAccessed({
      connection,
      edaId: access.edaId,
    });

    return {
      userId: access.userId,
      userFullName: user
        ? `${user.userFname} ${user.userLname}`.trim()
        : "",
      isAllStores: Boolean(access.edaIsAllStores),
      storeIds: access.storeIds,
    };
  } finally {
    connection.release();
  }
}
