export type VoucherValueType = "fixed" | "percent";
export type VoucherStatus = "active" | "redeemed" | "expired" | "void";

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
  voucherIsAllStores: number; // tinyint(1) as returned by mysql2 - 0 | 1
  voucherIssuedTo?: number | null; // Customers FK, null = bearer voucher
  voucherIssuedBy: number; // Users FK
  voucherPrintCount: number;
  voucherPrintedAt?: string | null;
  voucherRemarks?: string | null;
  voucherCreatedAt?: string;
  voucherUpdatedAt?: string;
  voucherDeletedAt?: string | null;
}

export interface VoucherStore {
  voucherStoreId: number;
  voucherId: number;
  storeId: number;
}

export interface SalesVoucher {
  salesVoucherId: number;
  salesId: number;
  voucherId: number;
  storeId: number;
  salesVoucherAmount: number;
  salesVoucherCreatedAt?: string;
  salesVoucherUpdatedAt?: string;
  salesVoucherDeletedAt?: string | null;
  salesVoucherCreatedBy: number;
}

export interface OrderVoucher {
  orderVoucherId: number;
  orderId: number;
  voucherId: number;
  storeId: number;
  orderVoucherAmount: number;
  orderVoucherCreatedAt?: string;
  orderVoucherUpdatedAt?: string;
  orderVoucherDeletedAt?: string | null;
  orderVoucherCreatedBy?: number | null; // Users FK, null when redeemed by a customer directly (no staff involved)
}

export interface DisplayVoucher extends Voucher {
  voucherIssuedByName?: string;
  voucherIssuedToName?: string | null;
  storeIds: number[];
  storeNames?: string[];
}

export interface AppliedVoucher {
  voucher: DisplayVoucher;
  appliedAmount: number;
}

export interface VoucherRedemption {
  source: "sale" | "order";
  referenceId: number;
  referenceNo: string | null;
  referenceCreatedAt: string;
  referenceTotalAmount: number;
  appliedAmount: number;
  storeId: number;
  storeName: string | null;
  customerId: number | null;
  customerName: string | null;
  redeemedByUserId: number | null;
  redeemedByName: string | null;
}
