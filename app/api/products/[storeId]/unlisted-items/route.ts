import { getProduct } from "@/controllers/ProductController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    const res = await getProduct({ keyFields: { storeId: storeId }, search });

    if (!res.success) {
      throw new Error(res.message || "Failed to add product.");
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
