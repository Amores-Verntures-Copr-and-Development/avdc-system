import { getProductsDashboardStatsController } from "@/controllers/ProductController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const storeName = searchParams.get("store") || "";

    const res = await getProductsDashboardStatsController({ storeName });

    if (!res.success) {
      throw new Error(`${res.message}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
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
