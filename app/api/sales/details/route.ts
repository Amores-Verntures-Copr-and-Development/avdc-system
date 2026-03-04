import { getTotalSalesDetails } from "@/controllers/SaleController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    const store = searchParams.get("store") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const includeSaleItems = searchParams.get("includeSaleItems") || "";
    const customer = searchParams.get("customer") || "";
    console.log({ from, to, store });
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
