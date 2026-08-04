import { selectVoucherById, updateVoucherStatus } from "@/models/voucherModel";

export async function voidVoucher(voucherId: number) {
  const voucher = await selectVoucherById({ voucherId });

  if (!voucher) {
    throw new Error("Voucher not found");
  }

  if (voucher.voucherStatus !== "active") {
    throw new Error(`Voucher is already ${voucher.voucherStatus}`);
  }

  await updateVoucherStatus({ voucherId, voucherStatus: "void" });

  return selectVoucherById({ voucherId });
}
