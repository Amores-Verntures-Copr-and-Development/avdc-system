import { updateRequestItemByStatus } from "@/controllers/RequestController";
import { RequestItems } from "@/types/request";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ requestId: string; reqItemId: string }>;
  },
) {
  const slug = (await params).requestId;
  const requestId = Number(slug);
  const slug1 = (await params).reqItemId;
  const reqItemId = Number(slug1);
  const req = (await request.json()) as Partial<RequestItems>;
  try {
    const res = await updateRequestItemByStatus({
      controller: "received",
      requestItems: [req],
    });
    if (!res.success) {
      throw new Error(res.message || "Failed to Update Request");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
      },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to receive request item",
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}
