import { getSales } from "@/controllers/SaleController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; salesNo: string }> },
) {
  try {
    const { storeId: storeIdSlug, salesNo } = await params;
    const storeId = Number(storeIdSlug);

    if (!storeId) {
      throw new Error("No store found");
    }
    if (!salesNo) {
      throw new Error("No sales number found");
    }

    const res = await getSales({
      keyFields: { salesNo },
      storeId,
      includeSaleItems: true,
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    const sale = res.data?.[0];

    if (!sale) {
      return NextResponse.json(
        { success: false, message: "Sale not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: sale,
      },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sale!",
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}
