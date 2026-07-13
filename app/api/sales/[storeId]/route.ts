import { getSalesByStoreId } from "@/controllers/SaleController";
import { count } from "console";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);

    if (!storeId) {
      throw new Error("No store found");
    }
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";
    const includeSaleItems = searchParams.get("includeSaleItems") || "";
    const customer = searchParams.get("customer") || "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;
    const offset = limitNumber * (pageNumber - 1);
    const method = searchParams.get("method") || "";
    const noLimit = searchParams.get("nolimit") || "";

    const res = await getSalesByStoreId({
      storeId,
      search,
      includeSaleItems: includeSaleItems === "true",
      customer: customer === "true",
      from,
      to,
      offset: offset,
      limit: limitNumber,
      method,
      noLimit: noLimit === "true" ? true : false,
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
