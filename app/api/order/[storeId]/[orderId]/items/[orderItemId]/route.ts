import { OrderItemController } from "@/controllers/OrderController";
import { UpdateOrderItemDto } from "@/dtos/orders.dto";
import { AccessTokenPayload, verifyToken } from "@/utils/jwt";
import { NextRequest, NextResponse } from "next/server";

// staff preparing orders can only update status - not remove items
const RESTRICTED_POSITIONS = ["staff", "supervisor", "purchaser"];

export async function PUT(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ storeId: string; orderId: string; orderItemId: string }>;
  },
) {
  try {
    const slug = (await params).orderItemId;
    const orderItemId = Number(slug);

    if (!orderItemId) {
      throw new Error("No orderItemId found");
    }

    const body = (await _request.json()) as Omit<
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
      { status: 500 },
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
    const slug = (await params).orderItemId;
    const orderItemId = Number(slug);

    if (!orderItemId) {
      throw new Error("No orderItemId found");
    }

    const token = request.cookies.get("avdc_accessToken")?.value;
    if (token) {
      try {
        const decoded = verifyToken<AccessTokenPayload>(token);
        if (
          decoded.userRole === "employee" &&
          RESTRICTED_POSITIONS.includes(String(decoded.empPosition ?? ""))
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
      } catch {
        // invalid/expired token - let the normal auth flow handle it
      }
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
      { status: 500 },
    );
  }
}
