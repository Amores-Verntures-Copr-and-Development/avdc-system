import { getTotalSalesDetails } from "@/controllers/SaleController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);

    const store = searchParams.get("store") || "";
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";

    const res = await getTotalSalesDetails({ store, from, to });

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
