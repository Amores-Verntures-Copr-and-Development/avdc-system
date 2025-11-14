import {
  createStockRooms,
  getStockRooms,
} from "@/controllers/StockRoomController";
import { CreateStockRoom } from "@/dtos/stockRoom.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreateStockRoom;
    const res = await createStockRooms(data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to create stock room");
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create stock room",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const res = await getStockRooms();
    if (!res.success) {
      console.log(res.error);
      throw new Error("Failed fetched stock rooms!");
    }
    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: "Failed fetched stock rooms!",
      error: e,
    });
  }
}
