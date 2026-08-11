export interface GrantExternalDashboardAccessDto {
  userId: number;
  edaIsAllStores: boolean;
  storeIds?: number[]; // ignored when edaIsAllStores is true
  edaCreatedBy: number; // set server-side from the session
}
