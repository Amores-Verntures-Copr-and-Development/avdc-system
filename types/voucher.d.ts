export type VoucherValueType = "fixed" | "percent";
export type VoucherStatus = "active" | "redeemed" | "expired" | "void";

export interface MockStore {
  storeId: number;
  storeName: string;
}

export interface Voucher {
  voucherId: number;
  voucherCode: string;
  voucherName?: string | null;
  voucherValueType: VoucherValueType;
  voucherFixedValue?: number | null; // used when valueType = "fixed"
  voucherPercent?: number | null; // used when valueType = "percent"
  voucherMaxDiscount?: number | null; // cap for percent type; null = no cap
  voucherBalance?: number | null; // running balance, fixed type only
  voucherMaxUses: number;
  voucherUsedCount: number;
  voucherStatus: VoucherStatus;
  voucherExpiresAt?: string | null;
  voucherIsAllStores: boolean;
  voucherStoreIds: number[]; // ignored when voucherIsAllStores is true
  voucherIssuedTo?: string | null; // customer name, optional/bearer if empty
  storeId: number; // issuing store
  voucherIssuedBy: string;
  voucherRemarks?: string | null;
  voucherCreatedAt: string;
}
