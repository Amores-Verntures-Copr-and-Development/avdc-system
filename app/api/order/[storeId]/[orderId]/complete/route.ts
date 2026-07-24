import { completeOrderController } from "@/controllers/OrderController";
import { AccessTokenPayload, verifyToken } from "@/utils/jwt";
import { NextRequest, NextResponse } from "next/server";

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

    const token = request.cookies.get("avdc_accessToken")?.value;
    if (!token) {
      throw new Error("Not authenticated");
    }

    const decoded = verifyToken<AccessTokenPayload>(token);

    const res = await completeOrderController({
      storeId,
      orderId,
      completedBy: decoded.userId,
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
      { status: 500 },
    );
  }
}
