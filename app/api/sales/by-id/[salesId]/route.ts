import { getSales } from "@/controllers/SaleController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ salesId: string }> },
) {
  try {
    const { salesId: salesIdSlug } = await params;
    const salesId = Number(salesIdSlug);

    if (!salesId) {
      throw new Error("No sales id found");
    }

    const res = await getSales({
      keyFields: { salesId },
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
