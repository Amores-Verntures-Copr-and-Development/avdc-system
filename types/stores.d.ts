export interface StoreInterface {
  storeId?: number | null;
  storeName: string;
  storeContactPhone: string;
  storeEmail: string;
  storeDescription?: string | null;
  storeLocation?: string | null;
  storeKioskEnabled?: boolean;
  storeKioskBannerImage?: string | null;
  storeOrderEnabled?: boolean;
  storeSalesApprovalEnabled?: boolean;
  storeCreatedAt: string;
  storeUpdatedAt: string;
  storeDeletedAt?: string | null;
  storeCreatedBy: number; // userId
  companyId: number | null;
}

export interface StoreEmployee {
  storeEmpId: number;
  storeId: number | null;
  empId: number;
  storeEmpCreatedAt: string;
  storeEmpUpdatedAt: string;
  storeEmpDeletedAt: string;
  storeEmpCreatedBy: number;
}
