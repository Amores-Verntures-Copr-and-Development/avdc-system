import { getSupplierItemById } from "@/controllers/SupplierController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ suppId: number }> }
) {
  try {
    const slug = (await params).suppId;
    const suppId = Number(slug);
    const res = await getSupplierItemById(suppId);

    if (!res.success) {
      console.log(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
