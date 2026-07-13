import { getTotalSalesDetails } from "@/controllers/SaleController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    // const limit = searchParams.get("limit") || "";
    // const page = searchParams.get("page") || "";
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";
    // const includeSaleItems = searchParams.get("includeSaleItems") || "";
    const customer = searchParams.get("customer") || "";

    if (!storeId) {
      throw new Error("No store found");
    }

    const res = await getTotalSalesDetails({ storeId, from, to, search });

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
