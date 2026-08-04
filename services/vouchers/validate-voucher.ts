import { selectVoucherByCode } from "@/models/voucherModel";
import { DisplayVoucher } from "@/types/voucher";
import { PoolConnection } from "mysql2/promise";

export interface VoucherValidationResult {
  voucher: DisplayVoucher;
  appliedAmount: number;
}

function computeAppliedAmount(
  voucher: DisplayVoucher,
  remainingAmount: number,
) {
  if (voucher.voucherValueType === "fixed") {
    return Math.min(Number(voucher.voucherBalance) || 0, remainingAmount);
  }

  const raw = remainingAmount * (Number(voucher.voucherPercent) / 100);
  const capped = voucher.voucherMaxDiscount
    ? Math.min(raw, Number(voucher.voucherMaxDiscount))
    : raw;

  return Math.min(capped, remainingAmount);
}

// Shared by the POS "validate before applying" endpoint AND the sale-creation
// redemption step - re-checked server-side at sale time since a voucher's
// status/balance can change between when a cashier applies it and confirms.
export async function validateAndComputeVoucher({
  voucherCode,
  storeId,
  remainingAmount,
  connection,
}: {
  voucherCode: string;
  storeId: number;
  remainingAmount: number;
  connection?: PoolConnection;
}): Promise<VoucherValidationResult> {
  const voucher = await selectVoucherByCode({ connection, voucherCode });

  if (!voucher) {
    throw new Error("Voucher not found");
  }

  if (voucher.voucherStatus !== "active") {
    throw new Error(`This voucher is ${voucher.voucherStatus}`);
  }

  if (
    voucher.voucherExpiresAt &&
    new Date(voucher.voucherExpiresAt) < new Date()
  ) {
    throw new Error("This voucher has expired");
  }

  if (!voucher.voucherIsAllStores && !voucher.storeIds.includes(storeId)) {
    throw new Error("This voucher isn't redeemable at this store");
  }

  if (
    voucher.voucherValueType === "fixed" &&
    Number(voucher.voucherBalance) <= 0
  ) {
    throw new Error("This voucher has no remaining balance");
  }

  if (
    voucher.voucherValueType === "percent" &&
    voucher.voucherUsedCount >= voucher.voucherMaxUses
  ) {
    throw new Error("This voucher has reached its usage limit");
  }

  if (remainingAmount <= 0) {
    throw new Error("There's nothing left to apply this voucher to");
  }

  const appliedAmount = computeAppliedAmount(voucher, remainingAmount);

  return { voucher, appliedAmount };
}
