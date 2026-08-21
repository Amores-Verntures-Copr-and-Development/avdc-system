import { updateProductVariantController } from "@/controllers/ProductController";
import { NextCloudServices } from "@/services/next-cloud/next-cloud";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
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

    const formData = await req.formData();
    const file = formData.getAll("image") as File[];

    if (!file[0]) {
      throw new Error("No image file found!");
    }

    const imageUpload = await NextCloudServices.uploadFile(
      Number(prodVarId),
      file[0],
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
