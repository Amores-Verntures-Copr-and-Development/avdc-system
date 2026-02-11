import {
  createProductVariantController,
  getProductVariantController,
} from "@/controllers/ProductController";
import { CreateProductVariantDto } from "@/dtos/products.dto";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; prodId: string }> },
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
  { params }: { params: Promise<{ storeId: string; prodId: string }> },
) {
  try {
    const slug = (await params).prodId;
    const prodId = Number(slug);

    const res = await getProductVariantController(
      prodId ? { keyFields: { prodId } } : {},
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
