import {
  createProductVariantController,
  getProductVariantController,
} from "@/controllers/ProductController";
import { CreateProductVariantDto } from "@/dtos/products.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    if (!storeId) {
      throw new Error("No storeId found");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const data = (await _request.json()) as CreateProductVariantDto;
    const res = await createProductVariantController(data);
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
    const statusParam = searchParams.get("status");
    // const category = searchParams.get("category") || "";
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";
    // const unit = searchParams.get("unit") || "";
    const isAvailableOnlineParam = searchParams.get("isAvailableOnline");
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;
    const status: "fast" | "slow" | undefined =
      statusParam === "fast"
        ? "fast"
        : statusParam === "slow"
          ? "slow"
          : undefined;
    const res = await getProductVariantController(
      storeId
        ? {
            keyFields:
              isAvailableOnlineParam === "1" || isAvailableOnlineParam === "0"
                ? { isAvailableOnline: isAvailableOnlineParam === "1" }
                : {},
            search,
            statusSold: status,
            from,
            to,
            storeId: storeId,
            limit: limitNumber,
            offset: limitNumber * (pageNumber - 1),
          }
        : {},
    );
    if (!res.success) {
      console.log(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
        count: res.total, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched products variants!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
