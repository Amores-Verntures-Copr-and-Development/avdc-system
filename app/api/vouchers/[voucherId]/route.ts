import { getVoucher, updateVoucher } from "@/controllers/VoucherController";
import { UpdateVoucherDto } from "@/dtos/voucher.dto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ voucherId: string }> },
) {
  try {
    const { voucherId: voucherIdSlug } = await params;
    const voucherId = Number(voucherIdSlug);

    if (!voucherId) {
      throw new Error("No voucher id found");
    }

    const res = await getVoucher(voucherId);

    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 404 },
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
        message: "Failed to fetch voucher!",
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ voucherId: string }> },
) {
  try {
    const { voucherId: voucherIdSlug } = await params;
    const voucherId = Number(voucherIdSlug);

    if (!voucherId) {
      throw new Error("No voucher id found");
    }

    const data = (await request.json()) as UpdateVoucherDto;

    const res = await updateVoucher(voucherId, data);

    if (!res.success) {
      throw new Error(res.message || "Failed to update voucher");
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
