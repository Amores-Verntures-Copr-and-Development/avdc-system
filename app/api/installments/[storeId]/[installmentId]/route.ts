import { getInstallment } from "@/controllers/InstallmentController";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; installmentId: string }> },
) {
  try {
    const { storeId: storeIdParam, installmentId: installmentIdParam } =
      await params;
    const storeId = Number(storeIdParam);
    const installmentId = Number(installmentIdParam);

    if (!storeId || !installmentId) {
      throw new Error("No installment found");
    }

    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, storeId);

    const res = await getInstallment({ installmentId, storeId });

    if (!res.success) {
      throw new Error(res.message || "Installment plan not found");
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
