import { getItemRequest } from "@/controllers/RequestController";

import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ requestId: string }>;
  }
) {
  try {
    const slug = (await params).requestId;
    const requsetId = Number(slug);
    console.log("Agi here getRequest");
    const res = await getItemRequest({ requestId: requsetId });
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
