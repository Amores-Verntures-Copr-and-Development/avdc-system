import {
  deleteOrderController,
  getOrderController,
  updateOrderController,
} from "@/controllers/OrderController";
import { UpdateOrderDto } from "@/dtos/orders.dto";
import { AccessTokenPayload, verifyToken } from "@/utils/jwt";
import { NextRequest, NextResponse } from "next/server";

// staff preparing orders can only update status - not delete the order
const RESTRICTED_POSITIONS = ["staff", "supervisor", "purchaser"];

export async function GET(
  _request: Request,
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
      { status: 500 },
    );
  }
}

export async function PUT(
  _request: Request,
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

    const body = (await _request.json()) as Omit<UpdateOrderDto, "orderId">;
    const data: UpdateOrderDto = { ...body, orderId };

    const res = await updateOrderController(data);

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
                "You are not allowed to delete orders - update the status instead.",
            },
            { status: 403 },
          );
        }
      } catch {
        // invalid/expired token - let the normal auth flow handle it
      }
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
      { status: 500 },
    );
  }
}
