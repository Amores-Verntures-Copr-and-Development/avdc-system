import { getOrderStatusHistory } from "@/controllers/OrderController";
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
    const { storeId, orderId } = await params;

    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, Number(storeId));

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
      { status: errorStatus(err) },
    );
  }
}
