import { OrderItemController } from "@/controllers/OrderController";
import { CreateOrderItemDto } from "@/dtos/orders.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "You do not have access to this store") return 403;
  return 500;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; orderId: string }> },
) {
  try {
    const { storeId, orderId: orderIdSlug } = await params;
    const orderId = Number(orderIdSlug);

    if (!orderId) {
      throw new Error("No orderId found");
    }

    const actingUser = getCurrentUser(request);
    assertStoreAccess(actingUser, Number(storeId));

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
      { status: errorStatus(err) },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; orderId: string }> },
) {
  try {
    const { storeId, orderId: orderIdSlug } = await params;
    const orderId = Number(orderIdSlug);

    if (!orderId) {
      throw new Error("No orderId found");
    }

    const actingUser = getCurrentUser(request);
    assertStoreAccess(actingUser, Number(storeId));

    const body = (await request.json()) as CreateOrderItemDto[];

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
      { status: errorStatus(err) },
    );
  }
}
