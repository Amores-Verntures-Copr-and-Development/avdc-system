import { Voucher } from "@/types/voucher";

export type CreateVoucherDto = Pick<
  Voucher,
  | "voucherCode"
  | "voucherName"
  | "voucherValueType"
  | "voucherFixedValue"
  | "voucherPercent"
  | "voucherMaxDiscount"
  | "voucherMaxUses"
  | "voucherExpiresAt"
  | "voucherIssuedTo"
  | "voucherIssuedBy"
  | "voucherRemarks"
> & {
  voucherIsAllStores: boolean;
  storeIds?: number[]; // ignored when voucherIsAllStores is true
};

export type UpdateVoucherDto = Partial<
  Pick<
    Voucher,
    | "voucherName"
    | "voucherFixedValue"
    | "voucherPercent"
    | "voucherMaxDiscount"
    | "voucherMaxUses"
    | "voucherExpiresAt"
    | "voucherIssuedTo"
    | "voucherRemarks"
  >
> & {
  voucherIsAllStores?: boolean;
  storeIds?: number[];
};

export interface CreateSalesVoucherDto {
  voucherId: number;
  salesVoucherAmount: number;
}

export interface ValidateVoucherDto {
  voucherCode: string;
  storeId: number;
  remainingAmount: number;
}
