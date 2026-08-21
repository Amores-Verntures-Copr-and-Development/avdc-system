import { getProduct } from "@/controllers/ProductController";
import { CreateProductDtos } from "@/dtos/products.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreateProductDtos[];

    return NextResponse.json(
      {
        success: true,
        message: "res.message",
        data: "res",
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add item in product",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function GET(_request: Request) {
  try {
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    const store = searchParams.get("store") || "";
    const category = searchParams.get("category") || "";
    const unit = searchParams.get("unit") || "";
    const barcode = searchParams.get("barcode") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;

    const res = await getProduct({
      search,
      storeName: store,
      category,
      unit,
      barcode,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
    });

    if (!res.success) {
      console.log(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
        count: res.count,
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
