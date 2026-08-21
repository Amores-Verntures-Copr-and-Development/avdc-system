import { sendSalesReceiptEmailController } from "@/controllers/SaleController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string; salesId: string }> },
) {
  try {
    const storeId = Number((await params).storeId);
    const slug = (await params).salesId;
    const salesId = Number(slug);

    if (!storeId) {
      throw new Error("No store found");
    }
    if (!salesId) {
      throw new Error("No sales id found");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const res = await sendSalesReceiptEmailController({ salesId });
    console.log({ res });
    if (!res.success) {
      return NextResponse.json(
        {
          success: false,
          message: res.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
      },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message || String(e),
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}
