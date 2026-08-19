import { OrderItemController } from "@/controllers/OrderController";
import { UpdateOrderItemDto } from "@/dtos/orders.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

// staff preparing orders can only update status - not remove items
const RESTRICTED_POSITIONS = ["staff", "supervisor", "purchaser"];

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "You do not have access to this store") return 403;
  return 500;
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ storeId: string; orderId: string; orderItemId: string }>;
  },
) {
  try {
    const { storeId, orderItemId: orderItemIdSlug } = await params;
    const orderItemId = Number(orderItemIdSlug);

    if (!orderItemId) {
      throw new Error("No orderItemId found");
    }

    const actingUser = getCurrentUser(request);
    assertStoreAccess(actingUser, Number(storeId));

    const body = (await request.json()) as Omit<
      UpdateOrderItemDto,
      "orderItemId"
    >;
    const data: UpdateOrderItemDto = { ...body, orderItemId };

    const res = await OrderItemController.update(data);

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
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ storeId: string; orderId: string; orderItemId: string }>;
  },
) {
  try {
    const { storeId, orderItemId: orderItemIdSlug } = await params;
    const orderItemId = Number(orderItemIdSlug);

    if (!orderItemId) {
      throw new Error("No orderItemId found");
    }

    const actingUser = getCurrentUser(request);
    assertStoreAccess(actingUser, Number(storeId));

    if (
      actingUser.userRole === "employee" &&
      RESTRICTED_POSITIONS.includes(
        String((actingUser as unknown as { empPosition?: string })
          .empPosition ?? ""),
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not allowed to delete order items - update the status instead.",
        },
        { status: 403 },
      );
    }

    const res = await OrderItemController.delete(orderItemId);

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
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
