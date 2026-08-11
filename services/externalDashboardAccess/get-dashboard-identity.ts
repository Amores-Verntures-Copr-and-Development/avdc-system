import { getDBConnection } from "@/lib/db";
import { selectExternalDashboardAccessByUserId } from "@/models/externalDashboardAccessModel";
import { selectUserWithUserId } from "@/models/userModels";

// Shared by both the token flow (verify-token.ts, keyed by token hash) and
// the password/session flow (already-known userId) - both need the same
// "is this grant still active, and who is it for" lookup.
export async function getExternalDashboardIdentity(userId: number) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    const access = await selectExternalDashboardAccessByUserId({
      connection,
      userId,
    });

    if (!access || access.edaStatus !== "active") {
      throw new Error("No active external dashboard access");
    }

    const userRows = await selectUserWithUserId({ connection, userId });
    const user = userRows[0];

    return {
      userId,
      userFullName: user ? `${user.userFname} ${user.userLname}`.trim() : "",
      isAllStores: Boolean(access.edaIsAllStores),
      storeIds: access.storeIds,
    };
  } finally {
    connection.release();
  }
}
