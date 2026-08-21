import { getProduct } from "@/controllers/ProductController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const { searchParams } = new URL(_request.url);

    const search = searchParams.get("search") || "";
    const barcode = searchParams.get("barcode") || "";
    const order = searchParams.get("order") || "";

    const category = searchParams.get("category") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;

    const res = await getProduct({
      keyFields: { storeId: storeId },
      search,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      barcode,
      category,
      isPos: true,
    });

    if (!res.success) {
      throw new Error(res.message || "Failed to add product.");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
        count: res.count, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched products!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
