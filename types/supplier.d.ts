export type SupplierStatus = "actice" | "inactive" | "deleted";
export type SupplierItemStatus = "actice" | "inactive" | "deleted";

export interface Supplier {
  suppId: number;
  suppCode: string; // e.g. "SUP-001"
  suppName: string; // e.g. "Techtronics Corp"
  suppContactPerson?: string | null;
  suppEmail?: string | null;
  suppAddress?: string | null;
  suppPhone?: string | null;
  suppStatus: SupplierStatus;
  suppCreatedAt: string; // ISO date string (e.g. "2025-10-08T02:45:13.000Z")
  suppUpdatedAt: string; // same as above
  suppCreatedBy: number; // FK to Users.userId
}

export interface SupplierItem {
  suppItemId: number;
  suppId: number;
  itemId: number;
  suppItemPrice: number;
  suppItemStatus: SupplierItemStatus;
  suppItemCreatedAt: string;
  suppItemUpdatedAt: string;
  suppItemCreatedBy: number;
}
