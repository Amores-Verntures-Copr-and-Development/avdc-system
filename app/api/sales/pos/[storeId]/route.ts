import { createSale } from "@/controllers/SaleController";
import { CreateSaleDto } from "@/dtos/sales.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    if (!slug) {
      throw new Error("No storeId found!");
    }

    const storeId = Number(slug);
    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const data = (await _request.json()) as CreateSaleDto;
    if (!data) {
      throw new Error("No data found!");
    }
    const res = await createSale(data);
    if (!res.success) {
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
      { status: 500 },
    );
  }
}
