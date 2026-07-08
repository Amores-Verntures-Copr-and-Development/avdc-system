import { getOwnerSalesChartData } from "@/controllers/DashboardController";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ year: string }> },
) {
  try {
    const slug = (await params).year;
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("store") || "";
    const res = await getOwnerSalesChartData({
      year: slug,
      storeId: Number(storeId),
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
