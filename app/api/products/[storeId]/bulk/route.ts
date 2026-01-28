import {
  createProductBulkController,
  createProductController,
  getProduct,
} from "@/controllers/ProductController";
import { CreateProductDtos } from "@/dtos/products.dto";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    if (!storeId) {
      throw new Error("No store found");
    }
    const data = (await _request.json()) as CreateProductDtos[];
    const res = await createProductBulkController(data);
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
        message: "Failed to add products!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
