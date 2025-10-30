import { createProducts } from "@/controllers/ProductController";
import { CreateProductDtos } from "@/dtos/products.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreateProductDtos[];

    const res = await createProducts(data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to add item in product");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add item in product",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
