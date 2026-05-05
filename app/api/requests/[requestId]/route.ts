import {
  updateRequest,
  updateRequestById,
} from "@/controllers/RequestController";
import { Request } from "@/types/request";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { requestId } = await params;

    if (!requestId) {
      throw new Error("No request ID found!");
    }
    const requestData = (await request.json()) as Partial<Request>;

    const res = await updateRequestById({ data: requestData });
    return NextResponse.json(
      {
        success: true,
        message: res.message,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update request!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
