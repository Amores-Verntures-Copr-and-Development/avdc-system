export type ExternalDashboardAccessStatus = "active" | "revoked";

export interface ExternalDashboardAccess {
  edaId: number;
  userId: number;
  edaIsAllStores: number; // 0 | 1
  edaTokenHash: string;
  edaStatus: ExternalDashboardAccessStatus;
  edaLastAccessedAt: string | null;
  edaCreatedBy: number;
  edaCreatedAt: string;
  edaUpdatedAt: string;
  edaRevokedAt: string | null;
}

export interface DisplayExternalDashboardAccess extends ExternalDashboardAccess {
  storeIds: number[];
  edaCreatedByName?: string;
}
