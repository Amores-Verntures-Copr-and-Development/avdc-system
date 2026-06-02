import { getSales } from "@/controllers/SaleController";
import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  try {
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const store = searchParams.get("store") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const method = searchParams.get("method") || "";
    const includeSaleItems = searchParams.get("includeSaleItems") || "";
    const customer = searchParams.get("customer") || "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;
    const offset = limitNumber * (pageNumber - 1);

    const res = await getSales({
      search,
      keyFields: {},
      storeName: store,
      from,
      to,
      includeSaleItems: includeSaleItems === "true",
      customer: customer === "true",
      offset: offset,
      limit: limitNumber,
      method,
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
