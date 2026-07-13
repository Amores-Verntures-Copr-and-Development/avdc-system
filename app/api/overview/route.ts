import { OverviewController } from "@/controllers/OverviewController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const trendParam = searchParams.get("trend") || "";
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";

    const trend =
      trendParam === "year" ||
      trendParam === "month" ||
      trendParam === "weeks" ||
      trendParam === "days"
        ? trendParam
        : undefined;

    const res = await OverviewController.get({
      trend: trend,
      from,
      to,
      notZeroSales: true,
    });

    if (!res.success) {
      throw new Error("Failed to fetch!");
    }
    return NextResponse.json(
      {
        data: res.data,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: "Failed to fetch!",
      },
      { status: 400 },
    );
  }
}
