import { OrderItemController } from "@/controllers/OrderController";
import { CreateOrderItemDto } from "@/dtos/orders.dto";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; orderId: string }> },
) {
  try {
    const slug = (await params).orderId;
    const orderId = Number(slug);

    if (!orderId) {
      throw new Error("No orderId found");
    }

    const res = await OrderItemController.get(orderId);

    if (!res.success) {
      throw new Error(`${res.error}`);
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
        message: "Failed to fetched order items!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; orderId: string }> },
) {
  try {
    const slug = (await params).orderId;
    const orderId = Number(slug);

    if (!orderId) {
      throw new Error("No orderId found");
    }

    const body = (await _request.json()) as CreateOrderItemDto[];

    const res = await OrderItemController.create({ orderId, data: body });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
