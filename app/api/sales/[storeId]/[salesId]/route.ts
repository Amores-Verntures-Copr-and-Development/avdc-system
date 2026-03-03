import { updateSalesController } from "@/controllers/SaleController";
import { Sales } from "@/types/sales";
import { NextResponse } from "next/server";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; salesId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug2 = (await params).salesId;
    const salesId = Number(slug2);

    if (!storeId) {
      throw new Error("No store found");
    }
    if (!salesId) {
      throw new Error("No sales id found");
    }
    const data = (await _request.json()) as Partial<Sales>;

    const res = await updateSalesController({ data: data });
    if (!res.success) {
      throw new Error(res.message || "Failed to update sales");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message,
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}
