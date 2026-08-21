import { getSalesTransactionsByProductVariant } from "@/controllers/SaleController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ prodVarId: string }> },
) {
  try {
    const prodVarId = Number((await params).prodVarId);
    const { searchParams } = new URL(_request.url);
    const storeIdParam = searchParams.get("storeId") || "";
    const store = searchParams.get("store") || "";
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;
    const offset = limitNumber * (pageNumber - 1);

    const res = await getSalesTransactionsByProductVariant({
      prodVarId,
      storeId: storeIdParam ? Number(storeIdParam) : undefined,
      storeName: store,
      from,
      to,
      limit: limitNumber,
      offset,
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
