import { createProductVariantBulkController } from "@/controllers/ProductController";
import { CreateProductVariantDto } from "@/dtos/products.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ storeId: string; prodId: string }>;
  },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    if (!storeId) {
      throw new Error("No storeId found");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const data = (await _request.json()) as CreateProductVariantDto[];

    const res = await createProductVariantBulkController(data);
    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add product variants!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
