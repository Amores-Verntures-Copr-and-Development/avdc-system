export type ExternalDashboardAccessStatus = "active" | "revoked";

export interface ExternalDashboardAccessStoreScope {
  storeId: number;
  edasSalesEnabled: number; // 0 | 1, same convention as edaIsAllStores
  edasInstallmentEnabled: number; // 0 | 1
}

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
  storeAccess: ExternalDashboardAccessStoreScope[];
  edaCreatedByName?: string;
}
