import { completeOrderController } from "@/controllers/OrderController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized" || err?.message === "Not authenticated")
    return 401;
  if (err?.message === "You do not have access to this store") return 403;
  return 500;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; orderId: string }> },
) {
  try {
    const { storeId: storeIdSlug, orderId: orderIdSlug } = await params;
    const storeId = Number(storeIdSlug);
    const orderId = Number(orderIdSlug);

    if (!storeId) {
      throw new Error("No store found");
    }
    if (!orderId) {
      throw new Error("No orderId found");
    }

    const actingUser = getCurrentUser(request);
    assertStoreAccess(actingUser, storeId);

    const res = await completeOrderController({
      storeId,
      orderId,
      completedBy: actingUser.userId,
    });

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
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
