import { getSales } from "@/controllers/SaleController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; customerId: string }> },
) {
  try {
    const { storeId, customerId } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    if (!storeId) {
      throw new Error("No store ID found!");
    }
    if (!customerId) {
      throw new Error("No customer ID found!");
    }

    const res = await getSales({
      customerId: Number(customerId),
      storeId: Number(storeId),
      from,
      to,
    });

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
