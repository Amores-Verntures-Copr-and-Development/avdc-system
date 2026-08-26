import { NextRequest, NextResponse } from "next/server";
import { approveSaleController } from "@/controllers/SaleController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string; salesId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug2 = (await params).salesId;
    const salesId = Number(slug2);
    if (!storeId) {
      throw new Error("No store found");
    }
    if (!salesId) {
      throw new Error("No sales id found");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const res = await approveSaleController({
      salesId,
      actingUser: actingUser as unknown as {
        userId: number;
        userRole: string;
        empPosition?: string;
      },
    });
    if (!res.success) {
      throw new Error(res.message || "Failed to approve sale");
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (e: any) {
    console.log(e);
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Failed to approve sale",
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}
