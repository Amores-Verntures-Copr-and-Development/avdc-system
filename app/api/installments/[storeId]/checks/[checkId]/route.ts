import { updateInstallmentCheckController } from "@/controllers/InstallmentController";
import { UpdateInstallmentCheckDto } from "@/dtos/installment.dto";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; checkId: string }> },
) {
  try {
    const { storeId: storeIdParam, checkId } = await params;
    const storeId = Number(storeIdParam);
    const installmentCheckId = Number(checkId);

    if (!storeId || !installmentCheckId) {
      throw new Error("No installment check found");
    }

    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, storeId);

    const body = (await request.json()) as UpdateInstallmentCheckDto;
    const data: UpdateInstallmentCheckDto = {
      ...body,
      installmentCheckDepositedBy:
        body.installmentCheckStatus === "deposited"
          ? actingUser.userId
          : body.installmentCheckDepositedBy,
    };

    const res = await updateInstallmentCheckController({
      installmentCheckId,
      storeId,
      data,
    });

    if (!res.success) {
      throw new Error(res.message || "Failed to update installment check");
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
