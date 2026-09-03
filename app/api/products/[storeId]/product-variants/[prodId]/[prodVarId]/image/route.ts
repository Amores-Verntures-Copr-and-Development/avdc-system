import { updateProductVariantController } from "@/controllers/ProductController";
import { NextCloudServices } from "@/services/next-cloud/next-cloud";
import { selectProductVariantImage } from "@/models/productModel";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { assertProductVariantBelongsToStore } from "@/lib/auth/assertProductVariantAccess";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ storeId: string; prodVarId: string; prodId: string }>;
  },
) {
  try {
    const { storeId, prodId, prodVarId } = await params;

    if (!storeId) {
      throw new Error("No store ID found!");
    }

    if (!prodId) {
      throw new Error("No product ID found!");
    }

    if (!prodVarId) {
      throw new Error("No product variant ID found!");
    }

    const actingUser = getCurrentUser(req);
    await assertStoreAccess(actingUser, Number(storeId));
    await assertProductVariantBelongsToStore(Number(prodVarId), Number(storeId));

    // Image is sent as a base64 JSON payload (not multipart/form-data): the
    // HTTPS origin was corrupting multipart bodies (stale service worker /
    // proxy), producing "Failed to parse body as FormData". JSON is unaffected.
    const body = (await req.json()) as {
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
    const file = new File([buffer], body.fileName || `${prodVarId}.png`, {
      type: body.fileType || "image/png",
    });

    const previousImage = await selectProductVariantImage(Number(prodVarId));

    const imageUpload = await NextCloudServices.uploadFile(
      Number(prodVarId),
      file,
    );
    console.log({ imageUpload });
    if (!imageUpload.success) {
      throw new Error(imageUpload.message || "Failed to upload image!");
    }

    const res = await updateProductVariantController({
      prodVarId: Number(prodVarId),
      prodVarImage: imageUpload.fileName,
    });

    if (!res.success) {
      throw new Error("Failed to upload image!");
    }

    // Best-effort: the DB already points at the new image, so a delete
    // failure here shouldn't fail the request - it just leaves the old
    // file orphaned instead of blocking the upload the user asked for.
    if (previousImage && previousImage !== imageUpload.fileName) {
      const cleanup = await NextCloudServices.deleteFile(previousImage);
      if (!cleanup.success) {
        console.log({ cleanupError: cleanup });
      }
    }

    return NextResponse.json(
      {
        success: res.success,
        message: "Image uploaded successfully!",
      },
      { status: 201 },
    );
  } catch (e: any) {
    console.log({ e });
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Image failed to upload!",
      },
      { status: 400 },
    );
  }
}
