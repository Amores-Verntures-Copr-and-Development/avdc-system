import { getOrderStatusHistory } from "@/controllers/OrderController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; orderId: string }> },
) {
  try {
    const { orderId } = await params;

    const res = await getOrderStatusHistory({ orderId: Number(orderId) });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order status history!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
