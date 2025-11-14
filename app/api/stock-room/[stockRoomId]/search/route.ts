import { searchStockRooms } from "@/controllers/StockRoomController";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await searchStockRooms({
      stockStoresKeyFields: { storeId: null },
    });

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
