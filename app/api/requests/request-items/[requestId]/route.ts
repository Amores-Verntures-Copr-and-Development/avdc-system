import { getItemRequest, getRequest } from "@/controllers/RequestController";
import { getRequestItems } from "@/services/requestServices";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: number }> }
) {
  try {
    const slug = (await params).requestId;
    console.log("Agi here getRequest");
    const res = await getItemRequest({ requestId: slug });
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to fetch request item");
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
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
