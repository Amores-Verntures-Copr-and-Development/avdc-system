import { getRequest } from "@/controllers/RequestController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "";
    const rawOrder = searchParams.get("order");
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";
    // const limit = searchParams.get("limit") || "";
    // const page = searchParams.get("page") || "";
    const store = searchParams.get("store") || "";
    // const limitNumber = Number(limit) || 100;
    // const pageNumber = Number(page) || 1;
    const order: "asc" | "desc" | undefined =
      rawOrder === "asc" || rawOrder === "desc" ? rawOrder : undefined;
    const res = await getRequest({ from, to, search, store, sort, order });
    if (!res.success) {
      throw new Error(res.message || "Failed to fetched request");
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
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
