import { createReport, getReports } from "@/controllers/ReportController";
import { CreateReportDto } from "@/dtos/report.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inventoryId: string }> }
) {
  try {
    const slug1 = (await params).inventoryId;
    const inventoryId = Number(slug1);

    if (!inventoryId) {
      throw new Error("No inventoryId found!");
    }
    const data = (await request.json()) as CreateReportDto;

    const res = await createReport(data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to create request");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create request",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inventoryId: string }> }
) {
  try {
    const slug1 = (await params).inventoryId;
    const inventoryId = Number(slug1);

    if (!inventoryId) {
      throw new Error("No inventoryId found!");
    }
    const res = await getReports({ keyFields: { inventoryId } });
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
