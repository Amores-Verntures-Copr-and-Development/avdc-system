import {
  createProductVariantController,
  getProductVariantController,
} from "@/controllers/ProductController";
import { CreateProductVariantDto } from "@/dtos/products.dto";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    if (!storeId) {
      throw new Error("No storeId found");
    }

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
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);

    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    const statusParam = searchParams.get("status");
    // const category = searchParams.get("category") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    // const unit = searchParams.get("unit") || "";
    // const limit = searchParams.get("limit") || "";
    // const page = searchParams.get("page") || "";

    const status: "fast" | "slow" | undefined =
      statusParam === "fast"
        ? "fast"
        : statusParam === "slow"
          ? "slow"
          : undefined;
    const res = await getProductVariantController(
      storeId ? { search, statusSold: status, from, to, storeId: storeId } : {},
    );
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
        message: "Failed to fetched products variants!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
