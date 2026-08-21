import {
  createSalesDiscounts,
  getSalesDiscountByStore,
} from "@/controllers/SalesDiscountController";
import { CreateDiscountDto } from "@/dtos/discounts.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    if (!storeId || storeId === 0) {
      throw new Error("No store found");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const data = (await _request.json()) as CreateDiscountDto;
    const res = await createSalesDiscounts(data);
    if (!res.success) {
      throw new Error(`${res.message}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);

    if (!storeId) {
      throw new Error("No store found");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const res = await getSalesDiscountByStore(storeId);

    if (!res.success) {
      console.log(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message,
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
