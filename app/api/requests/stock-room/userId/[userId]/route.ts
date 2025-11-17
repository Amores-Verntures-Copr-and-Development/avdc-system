import { getRequest } from "@/controllers/RequestController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const slug = (await params).userId;

    const res = await getRequest({
      userId: Number(slug),
      controller: "stock-room",
    });
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to create request");
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
