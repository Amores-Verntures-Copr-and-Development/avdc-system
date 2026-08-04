import { createVoucher, listVouchers } from "@/controllers/VoucherController";
import { CreateVoucherDto } from "@/dtos/voucher.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;

    const res = await listVouchers({
      search,
      status,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
        count: res.count,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message,
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    const body = (await request.json()) as CreateVoucherDto;

    const data: CreateVoucherDto = {
      ...body,
      voucherIssuedBy: user.userId,
    };

    const res = await createVoucher(data);

    if (!res.success) {
      throw new Error(res.message || "Failed to create voucher");
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 },
    );
  } catch (err: any) {
    const isAuthError = err?.message === "Unauthorized";
    return NextResponse.json(
      {
        success: false,
        message: err?.message,
        error: err?.message || String(err),
      },
      { status: isAuthError ? 401 : 500 },
    );
  }
}
