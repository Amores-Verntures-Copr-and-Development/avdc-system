import {
  deleteOrderController,
  getOrderController,
  updateOrderController,
} from "@/controllers/OrderController";
import { UpdateOrderDto } from "@/dtos/orders.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

// staff preparing orders can only update status - not delete the order
const RESTRICTED_POSITIONS = ["staff", "supervisor", "purchaser"];

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
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug2 = (await params).orderId;
    const orderId = Number(slug2);

    if (!storeId) {
      throw new Error("No store found");
    }
    if (!orderId) {
      throw new Error("No orderId found");
    }

    const actingUser = getCurrentUser(request);
    assertStoreAccess(actingUser, storeId);

    const res = await getOrderController({
      keyFields: { storeId, orderId },
    });

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
        message: "Failed to fetched order!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; orderId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug2 = (await params).orderId;
    const orderId = Number(slug2);

    if (!storeId) {
      throw new Error("No store found");
    }
    if (!orderId) {
      throw new Error("No orderId found");
    }

    const actingUser = getCurrentUser(request);
    assertStoreAccess(actingUser, storeId);

    const body = (await request.json()) as Omit<UpdateOrderDto, "orderId">;
    const data: UpdateOrderDto = { ...body, orderId };

    const res = await updateOrderController(data, actingUser.userId);

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
  { params }: { params: Promise<{ storeId: string; orderId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug2 = (await params).orderId;
    const orderId = Number(slug2);

    if (!storeId) {
      throw new Error("No store found");
    }
    if (!orderId) {
      throw new Error("No orderId found");
    }

    const actingUser = getCurrentUser(request);
    assertStoreAccess(actingUser, storeId);

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
            "You are not allowed to delete orders - update the status instead.",
        },
        { status: 403 },
      );
    }

    const res = await deleteOrderController(orderId);

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
