export interface StoreInterface {
  storeId?: number | null;
  storeName: string;
  storeContactPhone: string;
  storeEmail: string;
  storeDescription?: string | null;
  storeLocation?: string | null;
  storeKioskEnabled?: boolean;
  storeOrderEnabled?: boolean;
  storeCreatedAt: string;
  storeUpdatedAt: string;
  storeDeletedAt?: string | null;
  storeCreatedBy: number; // userId
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
