export interface GrantExternalDashboardAccessStoreDto {
  storeId: number;
  edasSalesEnabled: boolean;
  edasInstallmentEnabled: boolean;
}

export interface GrantExternalDashboardAccessDto {
  userId: number;
  edaIsAllStores: boolean;
  storeAccess?: GrantExternalDashboardAccessStoreDto[]; // ignored when edaIsAllStores is true
  edaCreatedBy: number; // set server-side from the session
}
