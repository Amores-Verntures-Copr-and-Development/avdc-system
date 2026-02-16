import {
  getItemRequest,
  updateRequestItem,
  updateRequestItemByStatus,
} from "@/controllers/RequestController";
import { RequestItems } from "@/types/request";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids"); // e
    if (!idsParam) {
      return NextResponse.json(
        { success: false, message: "No IDs provided" },
        { status: 400 },
      );
    }
    const res = await getItemRequest({});
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
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const req = await request.json();

    const { controller, data } = req;

    const res = await updateRequestItemByStatus({
      controller,
      requestItems: data,
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
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to Update Request",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
