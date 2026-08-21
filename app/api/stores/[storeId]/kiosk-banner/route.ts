import { updateStoreFeaturesController } from "@/controllers/StoreControllers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextCloudServices } from "@/services/next-cloud/next-cloud";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "You do not have access to this store") return 403;
  if (err?.message?.includes("Only Owner or Admin")) return 403;
  return 500;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const storeId = Number((await params).storeId);
    if (!storeId) {
      throw new Error("No store ID found!");
    }

    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, storeId);

    const formData = await request.formData();
    const file = formData.getAll("image") as File[];

    if (!file[0]) {
      throw new Error("No image file found!");
    }

    const imageUpload = await NextCloudServices.uploadFile(storeId, file[0]);
    if (!imageUpload.success) {
      throw new Error(imageUpload.message || "Failed to upload image!");
    }

    const res = await updateStoreFeaturesController({
      storeId,
      data: { storeKioskBannerImage: imageUpload.fileName },
      actingUser,
    });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Kiosk banner uploaded successfully!",
        data: { storeKioskBannerImage: imageUpload.fileName },
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to upload kiosk banner!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const storeId = Number((await params).storeId);
    if (!storeId) {
      throw new Error("No store ID found!");
    }

    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, storeId);

    const res = await updateStoreFeaturesController({
      storeId,
      data: { storeKioskBannerImage: null },
      actingUser,
    });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      { success: true, message: "Kiosk banner removed!" },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to remove kiosk banner!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
