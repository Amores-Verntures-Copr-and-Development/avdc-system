import { StockRoomUserController } from "@/controllers/StockRoomController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stockRoomId: string }> },
) {
  try {
    const { stockRoomId } = await params;
    if (!stockRoomId) {
      throw new Error("No ID found!");
    }
    const res = await StockRoomUserController.getUserNotInStockRoom(
      Number(stockRoomId),
    );

    if (!res.success) {
      throw new Error("Failed to fetch!");
    }

    return NextResponse.json(
      {
        data: res.data,
      },
      {
        status: 200,
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        message: "Failed to fetch",
      },
      {
        status: 400,
      },
    );
  }
}
