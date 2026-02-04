import { createVariantComponentController } from "@/controllers/ProductController";
import { CreateVarianComponentDto } from "@/dtos/products.dto";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ storeId: string; prodId: string; prodVarId: string }>;
  },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    if (!storeId) {
      throw new Error("No storeId found");
    }
    const data = (await _request.json()) as CreateVarianComponentDto[];
    const res = await createVariantComponentController(data);
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
