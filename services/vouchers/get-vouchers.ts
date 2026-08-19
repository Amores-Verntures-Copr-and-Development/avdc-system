import {
  countVouchers,
  selectVoucherByCode,
  selectVoucherById,
  selectVoucherRedemptions,
  selectVouchers,
} from "@/models/voucherModel";

export async function getVouchers({
  search,
  status,
  limit,
  offset,
}: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const data = await selectVouchers({ search, status, limit, offset });
  const count = await countVouchers({ search, status });

  return { data, count: count[0]?.count ?? 0 };
}

export async function getVoucherById(voucherId: number) {
  return selectVoucherById({ voucherId });
}

export async function getVoucherByCode(voucherCode: string) {
  return selectVoucherByCode({ voucherCode });
}

export async function getVoucherRedemptions(voucherId: number) {
  return selectVoucherRedemptions({ voucherId });
}
