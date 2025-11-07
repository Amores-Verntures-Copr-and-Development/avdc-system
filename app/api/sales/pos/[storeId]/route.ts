import { createSale } from "@/controllers/SaleController";
import { CreateSaleDto } from "@/dtos/sales.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const slug = (await params).storeId;
    const data = (await _request.json()) as CreateSaleDto;
    const authorization = _request.headers.get(`authorization`);
    console.log("[authorization]: ", authorization);
    if (!slug) {
      throw new Error("No storeId found!");
    }
    if (!data) {
      throw new Error("No data found!");
    }
    const res = await createSale(data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to process order");
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create sale",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
