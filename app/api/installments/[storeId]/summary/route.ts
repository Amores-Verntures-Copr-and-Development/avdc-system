import { getInstallmentsSummary } from "@/controllers/InstallmentController";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const storeId = Number((await params).storeId);
    if (!storeId) {
      throw new Error("No store found");
    }

    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, storeId);

    const res = await getInstallmentsSummary({ storeId });

    if (!res.success) {
      throw new Error(res.message || "Failed to fetch installment summary");
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
        message: err?.message,
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
