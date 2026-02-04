import { getSalesItemBySalesId } from "@/controllers/SaleController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; salesId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug2 = (await params).salesId;
    const salesId = Number(slug2);

    if (!storeId) {
      throw new Error("No store found");
    }
    if (!salesId) {
      throw new Error("No sales id found");
    }

    const res = await getSalesItemBySalesId(salesId);

    if (!res.success) {
      throw new Error(`${res.error}`);
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
