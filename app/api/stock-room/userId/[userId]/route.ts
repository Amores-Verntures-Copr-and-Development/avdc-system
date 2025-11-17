import { getStockRooms } from "@/controllers/StockRoomController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const slug = (await params).userId;
    console.log({ slug });
    const res = await getStockRooms({ keySPFields: { userId: Number(slug) } });
    console.log({});
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
    console.log(e);
    return NextResponse.json({
      success: false,
      message: "Failed fetched stock rooms!",
      error: e,
    });
  }
}
