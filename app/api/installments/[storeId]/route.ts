import { createInstallment, getInstallments } from "@/controllers/InstallmentController";
import { CreateInstallmentDto } from "@/dtos/installment.dto";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const storeId = Number((await params).storeId);
    if (!storeId) {
      throw new Error("No store found");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;

    const res = await getInstallments({
      storeId,
      search,
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const storeId = Number((await params).storeId);
    if (!storeId) {
      throw new Error("No store found");
    }

    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, storeId);

    const body = (await request.json()) as CreateInstallmentDto;

    const data: CreateInstallmentDto = {
      ...body,
      storeId,
      installmentCreatedBy: actingUser.userId,
    };

    const res = await createInstallment(data);

    if (!res.success) {
      throw new Error(res.message || "Failed to create installment plan");
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
