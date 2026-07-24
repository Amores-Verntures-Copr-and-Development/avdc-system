import {
  getOrderController,
  OrderItemController,
} from "@/controllers/OrderController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; publicId: string }> },
) {
  try {
    const { id, publicId } = await params;
    const customerId = Number(id);

    if (!customerId) {
      throw new Error("No customer found");
    }
    if (!publicId) {
      throw new Error("No order found");
    }

    const res = await getOrderController({
      keyFields: { customerId, orderPublicId: publicId },
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    const order = res.data?.[0];

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found!",
        },
        { status: 404 },
      );
    }

    const itemsRes = await OrderItemController.get(order.orderId);

    return NextResponse.json(
      {
        success: true,
        message: "Order fetched successfully!",
        data: {
          ...order,
          items: itemsRes.success ? itemsRes.data : [],
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
