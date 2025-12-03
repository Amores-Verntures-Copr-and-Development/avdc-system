export interface StoreInterface {
  storeId?: number | null;
  storeName: string;
  storeContactPhone: string;
  storeEmail: string;
  storeDescription?: string | null;
  storeLocation?: string | null;
  storeCreatedAt: string;
  storeUpdatedAt: string;
  storeDeletedAt?: string | null;
  storeCreatedBy: number; // userId
}

export interface StoreEmployee {
  storeEmpId: number;
  storeId: number;
  empId: number;
  storeEmpCreatedAt: number;
  storeEmpUpdatedAt: number;
  storeEmpDeletedAt: number;
  storeEmpCreatedBy: number;
}
