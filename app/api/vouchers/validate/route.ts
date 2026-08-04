import { validateVoucher } from "@/controllers/VoucherController";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voucherCode, storeId, remainingAmount } = body;

    if (!voucherCode) {
      throw new Error("No voucher code provided");
    }
    if (!storeId) {
      throw new Error("No store id provided");
    }

    const res = await validateVoucher({
      voucherCode,
      storeId: Number(storeId),
      remainingAmount: Number(remainingAmount) || 0,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 400 },
      );
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
