import { getCategories } from "@/controllers/CategoryController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _Request: NextRequest,
  { params }: { params: Promise<{ stockRoomId: string }> },
) {
  try {
    const slug = (await params).stockRoomId;
    const stockRoomId = Number(slug);
    const res = await getCategories({
      controller: "stockRoomId",
      id: stockRoomId,
    });

    if (!res.success) {
      throw new Error(`${res.message ?? "Failed to fetch category"}`);
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
        message: "User add failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
