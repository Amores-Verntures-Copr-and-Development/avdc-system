import { getInventoryReportWithItem } from "@/controllers/ReportController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ inventoryId: string; reportId: string }> }
) {
  try {
    const slug1 = (await params).inventoryId;
    const slug2 = (await params).reportId;
    const inventoryId = Number(slug1);
    const reportId = Number(slug2);

    if (!inventoryId) {
      throw new Error("No inventoryId found!");
    }
    const res = await getInventoryReportWithItem({
      keyInvRepFields: { reportId: reportId },
      keyReportFields: { reportType: "inventory" },
    });
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to fetch report");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch report",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
