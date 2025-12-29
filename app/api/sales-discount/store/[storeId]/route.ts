import {
  createSalesDiscounts,
  getSalesDiscountByStore,
} from "@/controllers/SalesDiscountController";

import { CreateSalesDiscountDto } from "@/dtos/discounts.dto";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    if (!storeId || storeId === 0) {
      throw new Error("No store found");
    }
    const data = (await _request.json()) as CreateSalesDiscountDto;
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
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);

    if (!storeId) {
      throw new Error("No store found");
    }

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
