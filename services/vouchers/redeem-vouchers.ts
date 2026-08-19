import { CreateOrderVoucherDto, CreateSalesVoucherDto } from "@/dtos/voucher.dto";
import {
  applyVoucherRedemption,
  insertOrderVoucher,
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

// Records a SalesVoucher link for a voucher that was already redeemed
// elsewhere (e.g. on the Order this sale was converted from) - deliberately
// does NOT call applyVoucherRedemption, since that already ran once when
// the voucher was first redeemed. Re-running it here would decrement the
// voucher's balance/usedCount a second time for the same redemption.
export async function linkVouchersToSale({
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

  await insertSalesVoucher({
    connection,
    data: vouchers.map((v) => ({
      salesId,
      voucherId: v.voucherId,
      storeId,
      salesVoucherAmount: v.salesVoucherAmount,
      salesVoucherCreatedBy: createdBy,
    })),
  });
}

// Mirrors redeemVouchersForSale for the online-order path - called from inside
// the order's own transaction, so a voucher failure rolls back the whole
// order the same way an item/pricing failure would. Unlike POS sales (which
// only ever have one authenticated cashier), an online order may be placed by
// a guest or a logged-in customer with no staff user attached, so createdBy
// is optional here.
export async function redeemVouchersForOrder({
  connection,
  orderId,
  storeId,
  createdBy,
  vouchers,
}: {
  connection: PoolConnection;
  orderId: number;
  storeId: number;
  createdBy?: number | null;
  vouchers?: CreateOrderVoucherDto[];
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
        : Number(v.orderVoucherAmount);

    const safeAmount = Math.min(Number(v.orderVoucherAmount), maxAmount);

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

    await insertOrderVoucher({
      connection,
      data: {
        orderId,
        voucherId: voucher.voucherId,
        storeId,
        orderVoucherAmount: safeAmount,
        orderVoucherCreatedBy: createdBy ?? null,
      },
    });
  }
}
