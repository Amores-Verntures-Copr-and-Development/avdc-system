import {
  deleteProductVariantController,
  getProductVariantController,
  updateProductVariantController,
} from "@/controllers/ProductController";
import { ProductVariants } from "@/types/products";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import {
  assertProductVariantBelongsToStore,
  assertInventoryItemBelongsToStore,
} from "@/lib/auth/assertProductVariantAccess";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ storeId: string; prodId: string; prodVarId: string }>;
  },
) {
  try {
    const storeId = Number((await params).storeId);
    const slug = (await params).prodVarId;
    const prodVarId = Number(slug);

    if (!prodVarId) {
      throw new Error("No prodVarId found");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);
    await assertProductVariantBelongsToStore(prodVarId, storeId);

    const res = await getProductVariantController({
      keyFields: { prodVarId },
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    const data = res.data?.[0] ?? null;

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Product variant not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product variant!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ storeId: string; prodVarId: string; prodId: string }>;
  },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug1 = (await params).prodVarId;
    const prodVarId = Number(slug1);
    if (!storeId) {
      throw new Error("No storeId found");
    }
    if (!prodVarId) {
      throw new Error("No prodVarId found");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);
    await assertProductVariantBelongsToStore(prodVarId, storeId);

    const body = (await _request.json()) as Partial<ProductVariants>;
    // Explicit allowlist, not a body spread - PRODUCT_VARIANT_COLUMNS also
    // permits prodId, prodVarImage, and the audit columns, none of which
    // this endpoint should ever let a client set: prodId would silently
    // move the variant into a different (possibly cross-store) product,
    // and prodVarImage is only ever written by the dedicated image
    // upload/delete route, which controls the stored filename's format.
    // prodVarId itself always comes from the path, never the body -
    // otherwise a request authorized for this store's prodVarId could
    // still target a different store's variant by key confusion.
    //
    // Only copy fields actually present in the body (not just allowed) -
    // the update builder below sends every present key as a bind param, so
    // an omitted field must stay absent rather than become an explicit
    // `undefined`, which mysql2 rejects.
    const ALLOWED_FIELDS = [
      "prodVarName",
      "prodVarPrice",
      "prodVarPriceOnline",
      "prodVarUnit",
      "isDeductInv",
      "isAvailableOnline",
      "isAvailableKiosk",
      "kioskOrder",
      "inventoryItemId",
    ] as const satisfies readonly (keyof ProductVariants)[];

    const data: Partial<ProductVariants> = { prodVarId };
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        (data as any)[field] = body[field];
      }
    }

    if (data.inventoryItemId != null) {
      // Otherwise this variant could be pointed at another store's
      // inventory item, so future sales would decrement the wrong store's
      // stock.
      await assertInventoryItemBelongsToStore(data.inventoryItemId, storeId);
    }

    const res = await updateProductVariantController(data);
    if (!res.success) {
      console.log(res.message);
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

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ storeId: string; prodId: string; prodVarId: string }>;
  },
) {
  try {
    // const { searchParams } = new URL(_request.url);
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug2 = (await params).prodId;
    const prodId = Number(slug2);
    const slug3 = (await params).prodVarId;
    const prodVarId = Number(slug3);
    if (!storeId) {
      throw new Error("No store found");
    }
    if (!prodId) {
      throw new Error("No productId found");
    }
    if (!prodId) {
      throw new Error("No productId found");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);
    await assertProductVariantBelongsToStore(prodVarId, storeId);

    const res = await deleteProductVariantController({ prodVarId: prodVarId });

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
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
