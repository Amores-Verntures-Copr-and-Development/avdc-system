import { getProduct } from "@/controllers/ProductController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inventoryId: string }> }
) {
  try {
    const slug = (await params).inventoryId;
    const inventoryId = Number(slug);
    const res = await getProduct({ inventoryId });
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
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched products!",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
