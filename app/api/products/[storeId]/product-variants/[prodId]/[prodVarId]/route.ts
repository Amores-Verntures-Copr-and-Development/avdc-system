import {
  createProductVariantController,
  updateProductVariantController,
} from "@/controllers/ProductController";
import { ProductVariants } from "@/types/products";
import { NextResponse } from "next/server";

export async function PUT(
  _request: Request,
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
    const data = (await _request.json()) as Partial<ProductVariants>;
    const res = await updateProductVariantController(data);
    if (!res.success) {
      console.log(res.message);
      throw new Error(`${res.error}`);
    }
    console.log({ data });
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
