import { CreateSalesVoucherDto } from "@/dtos/voucher.dto";
import {
  applyVoucherRedemption,
  insertSalesVoucher,
  selectVoucherById,
} from "@/models/voucherModel";
import { PoolConnection } from "mysql2/promise";

// Called from inside the sale's own transaction - a voucher failure here
// rolls back the whole sale, same as an inventory-shortage failure would.
export async function redeemVouchersForSale({
  connection,
  salesId,
  storeId,
  createdBy,
  vouchers,
}: {
  connection: PoolConnection;
  salesId: number;
  storeId: number;
  createdBy: number;
  vouchers?: CreateSalesVoucherDto[];
}) {
  if (!vouchers || vouchers.length === 0) return;

  for (const v of vouchers) {
    const voucher = await selectVoucherById({
      connection,
      voucherId: v.voucherId,
    });

    if (!voucher) {
      throw new Error(`Voucher ${v.voucherId} not found`);
    }

    if (voucher.voucherStatus !== "active") {
      throw new Error(
        `Voucher ${voucher.voucherCode} is ${voucher.voucherStatus}`,
      );
    }

    if (!voucher.voucherIsAllStores && !voucher.storeIds.includes(storeId)) {
      throw new Error(
        `Voucher ${voucher.voucherCode} isn't redeemable at this store`,
      );
    }

    // Never trust the client's requested amount beyond what's actually
    // available server-side right now - re-derive the cap for fixed-value
    // vouchers from the current balance.
    const maxAmount =
      voucher.voucherValueType === "fixed"
        ? Number(voucher.voucherBalance) || 0
        : Number(v.salesVoucherAmount);

    const safeAmount = Math.min(Number(v.salesVoucherAmount), maxAmount);

    if (safeAmount <= 0) {
      throw new Error(
        `Voucher ${voucher.voucherCode} has no remaining balance`,
      );
    }

    await applyVoucherRedemption({
      connection,
      voucherId: voucher.voucherId,
      appliedAmount: safeAmount,
    });

    await insertSalesVoucher({
      connection,
      data: [
        {
          salesId,
          voucherId: voucher.voucherId,
          storeId,
          salesVoucherAmount: safeAmount,
          salesVoucherCreatedBy: createdBy,
        },
      ],
    });
  }
}
