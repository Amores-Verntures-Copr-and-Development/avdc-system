import { updateStoreFeaturesController } from "@/controllers/StoreControllers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextCloudServices } from "@/services/next-cloud/next-cloud";
import { selectStoreKioskBannerImage } from "@/models/storeModels";
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

    // Image is sent as a base64 JSON payload (not multipart/form-data): the
    // HTTPS origin was corrupting multipart bodies (stale service worker /
    // proxy), producing "Failed to parse body as FormData". JSON is unaffected.
    const body = (await request.json()) as {
      image?: string;
      fileName?: string;
      fileType?: string;
    };

    if (!body.image) {
      throw new Error("No image file found!");
    }

    const base64 = body.image.includes(",")
      ? body.image.split(",").pop()!
      : body.image;
    const buffer = Buffer.from(base64, "base64");
    const file = new File([buffer], body.fileName || `${storeId}-banner.png`, {
      type: body.fileType || "image/png",
    });

    const previousBanner = await selectStoreKioskBannerImage(storeId);

    const imageUpload = await NextCloudServices.uploadFile(storeId, file);
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

    // Best-effort: the DB already points at the new banner, so a delete
    // failure here shouldn't fail the request - it just leaves the old
    // file orphaned instead of blocking the upload the user asked for.
    if (previousBanner && previousBanner !== imageUpload.fileName) {
      const cleanup = await NextCloudServices.deleteFile(previousBanner);
      if (!cleanup.success) {
        console.log({ cleanupError: cleanup });
      }
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

    const previousBanner = await selectStoreKioskBannerImage(storeId);

    const res = await updateStoreFeaturesController({
      storeId,
      data: { storeKioskBannerImage: null },
      actingUser,
    });

    if (!res.success) {
      throw new Error(res.message);
    }

    if (previousBanner) {
      const cleanup = await NextCloudServices.deleteFile(previousBanner);
      if (!cleanup.success) {
        console.log({ cleanupError: cleanup });
      }
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
