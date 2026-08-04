import { voidVoucher } from "@/controllers/VoucherController";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ voucherId: string }> },
) {
  try {
    const { voucherId: voucherIdSlug } = await params;
    const voucherId = Number(voucherIdSlug);

    if (!voucherId) {
      throw new Error("No voucher id found");
    }

    const res = await voidVoucher(voucherId);

    if (!res.success) {
      throw new Error(res.message || "Failed to void voucher");
    }

    return NextResponse.json(
      { success: true, message: res.message, data: res.data },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message,
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}
