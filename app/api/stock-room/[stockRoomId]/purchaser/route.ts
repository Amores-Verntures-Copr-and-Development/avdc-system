import { getStockPurchasers } from "@/controllers/StockRoomController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ stockRoomId: string }> }
) {
  try {
    const slug = (await params).stockRoomId;
    const id = Number(slug);
    const res = await getStockPurchasers({
      stockPurchaserFields: { stockRoomId: id },
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
