import {
  selectExternalDashboardAccessByUserId,
  updateExternalDashboardAccessStatus,
} from "@/models/externalDashboardAccessModel";

export async function revokeExternalDashboardAccess(userId: number) {
  const existing = await selectExternalDashboardAccessByUserId({ userId });

  if (!existing) {
    throw new Error("This user has no external dashboard access to revoke");
  }

  if (existing.edaStatus === "revoked") {
    throw new Error("External dashboard access is already revoked");
  }

  await updateExternalDashboardAccessStatus({
    edaId: existing.edaId,
    edaStatus: "revoked",
  });

  return selectExternalDashboardAccessByUserId({ userId });
}
