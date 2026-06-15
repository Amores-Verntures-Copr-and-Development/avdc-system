import { StockRoomUserController } from "@/controllers/StockRoomController";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ stockRoomId: string; srUserId: string }> },
) {
  try {
    const { stockRoomId, srUserId } = await params;

    if (!stockRoomId) {
      throw new Error("No stock room ID found!");
    }
    if (!srUserId) {
      throw new Error("No stock room user ID found!");
    }
    const res = await StockRoomUserController.delete({
      keyFields: ["srUserId"],
      data: [{ srUserId: Number(srUserId), stockRoomId: Number(stockRoomId) }],
    });

    if (!res.success) {
      throw new Error("Failed to removed stock room user!");
    }
    return NextResponse.json(
      {
        success: true,
        message: "User removed in stock room!",
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to removed user in stock room!",
      },
      { status: 400 },
    );
  }
}
