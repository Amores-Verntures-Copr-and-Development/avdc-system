import { getProduct } from "@/controllers/ProductController";
import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  try {
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    const store = searchParams.get("store") || "";

    const res = await getProduct({ search, storeName: store });

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
        message: "Failed to fetched products!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
