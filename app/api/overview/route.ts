import { OverviewController } from "@/controllers/OverviewController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const trendParam = searchParams.get("trend") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const trend =
      trendParam === "year" ||
      trendParam === "month" ||
      trendParam === "weeks" ||
      trendParam === "days"
        ? trendParam
        : undefined;
    console.log({ trend });
    const res = await OverviewController.get({ trend: trend, from, to });

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
