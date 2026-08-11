import {
  selectExternalDashboardAccessByUserId,
  updateExternalDashboardAccessToken,
} from "@/models/externalDashboardAccessModel";
import { generateRawToken, hashToken } from "./token";

export async function regenerateExternalDashboardAccessToken(
  userId: number,
) {
  const existing = await selectExternalDashboardAccessByUserId({ userId });

  if (!existing) {
    throw new Error("This user has no external dashboard access");
  }

  const rawToken = generateRawToken();

  await updateExternalDashboardAccessToken({
    edaId: existing.edaId,
    edaTokenHash: hashToken(rawToken),
  });

  return { rawToken };
}
