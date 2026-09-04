import {
  getStore,
  updateStoreFeaturesController,
} from "@/controllers/StoreControllers";
import { UpdateStoreFeaturesDto } from "@/dtos/store.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
  } catch (e) {}
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const storeId = Number((await params).storeId);

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const res = await getStore({ keyfields: { storeId } });
    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to fetch store!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const storeId = Number((await params).storeId);
    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, storeId);
    const body = (await request.json()) as UpdateStoreFeaturesDto;
    // storeKioskBannerImage is deliberately excluded from this generic
    // endpoint - it's exempt from the admin/owner gate below (feature
    // toggles only), so allowing it here would let any store user write an
    // arbitrary value into a field that later gets passed straight into a
    // Nextcloud file path. Only the kiosk-banner upload/delete routes,
    // which control the filename format themselves, may set it.
    const data: UpdateStoreFeaturesDto = {
      storeKioskEnabled: body.storeKioskEnabled,
      storeOrderEnabled: body.storeOrderEnabled,
      storeSalesApprovalEnabled: body.storeSalesApprovalEnabled,
      storeInstallmentEnabled: body.storeInstallmentEnabled,
    };

    const res = await updateStoreFeaturesController({
      storeId,
      data,
      actingUser,
    });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (err: any) {
    console.log({ error: err });
    const isAuthError = err?.message === "Unauthorized";
    const isForbidden =
      err?.message?.includes("Only Owner or Admin") ||
      err?.message === "You do not have access to this store" ||
      err?.message?.includes("Installment is not enabled");

    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to update store!",
        error: err?.message || String(err),
      },
      { status: isAuthError ? 401 : isForbidden ? 403 : 500 },
    );
  }
}
