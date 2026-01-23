import { getProduct, updateProductById } from "@/controllers/ProductController";
import { Products } from "@/types/products";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; prodId: string }> },
) {
  try {
    const { searchParams } = new URL(_request.url);
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug2 = (await params).prodId;
    const prodId = Number(slug);
    if (!storeId) {
      throw new Error("No store found");
    }
    if (!prodId) {
      throw new Error("No productId found");
    }
    const res = await getProduct({
      keyFields: { prodId: prodId, storeId: storeId },
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

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; prodId: string }> },
) {
  try {
    const { searchParams } = new URL(_request.url);
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug2 = (await params).prodId;
    const prodId = Number(slug);
    if (!storeId) {
      throw new Error("No store found");
    }
    if (!prodId) {
      throw new Error("No productId found");
    }
    const data = (await _request.json()) as Partial<Products>;
    const res = await updateProductById(data);

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
        message: "Failed to fetched products!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
