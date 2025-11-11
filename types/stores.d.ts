export interface StoreInterface {
  storeId: number;
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
