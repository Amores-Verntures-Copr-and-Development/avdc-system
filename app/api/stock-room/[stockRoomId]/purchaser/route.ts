import {
  createStockPurchasers,
  getStockPurchasers,
} from "@/controllers/StockRoomController";
import { CreateStockPurchaser } from "@/dtos/stockRoom.dto";
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

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ stockRoomId: string }> }
) {
  try {
    const slug = (await params).stockRoomId;
    const data = (await _request.json()) as CreateStockPurchaser[];
    const id = Number(slug);
    if (!id) {
      throw new Error("No stock room id found!");
    }
    if (!data || data.length === 0) {
      throw new Error("No data found!");
    }
    const res = await createStockPurchasers(data);

    if (!res.success) {
      console.log(res.error);
      throw new Error("Failed to add stock purchaser!");
    }
    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.result,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: "Failed to add stock purchaser!",
      error: e,
    });
  }
}
