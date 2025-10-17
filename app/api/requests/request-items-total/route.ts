import {
  getItemRequest,
  getItemRequestByIds,
  getRequest,
} from "@/controllers/RequestController";
import { getRequestItems } from "@/services/requestServices";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids"); // e
    if (!idsParam) {
      return NextResponse.json(
        { success: false, message: "No IDs provided" },
        { status: 400 }
      );
    }
    const ids: number[] = idsParam
      .split(",")
      .map((id) => Number(id.trim()))
      .filter(Boolean);
    const res = await getItemRequestByIds({ requestId: ids });
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
