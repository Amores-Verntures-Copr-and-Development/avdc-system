export type CompanyStatus = "active" | "suspended" | "cancelled";

export interface Companies {
  companyId: number;
  companyName: string;
  companyEmail: string | null;
  companyPhone: string | null;
  companyStatus: CompanyStatus;
  companyCreatedAt: string;
  companyUpdatedAt: string;
  companyDeletedAt: string | null;
  companyCreatedBy: number;
  companyMaxStores: number;
  // Platform-level entitlement - a store can only turn on its own
  // storeInstallmentEnabled toggle when this is true.
  companyInstallmentEnabled: boolean;
}
