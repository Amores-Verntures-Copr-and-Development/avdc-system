import { StockRoomUserController } from "@/controllers/StockRoomController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    const res = await StockRoomUserController.get({
      fields: { userId: Number(userId) },
    });

    if (!res.success) {
      throw new Error("Failed to fetch stock rooms for user!");
    }

    return NextResponse.json(
      {
        success: true,
        data: res.data,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch stock rooms for user!",
      },
      { status: 400 },
    );
  }
}
