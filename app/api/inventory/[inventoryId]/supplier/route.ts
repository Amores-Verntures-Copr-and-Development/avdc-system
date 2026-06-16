import { getSupplierByInventory } from "@/controllers/SupplierController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ inventoryId: string }> },
) {
  try {
    const { inventoryId } = await params;

    const res = await getSupplierByInventory(Number(inventoryId));

    if (!res.success) {
      throw new Error(res.message);
    }
    return NextResponse.json(
      {
        success: true,
        message: "Fetch successfully!",
        data: res.data,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Fetch failed!",
        error: e,
      },
      { status: 400 },
    );
  }
}
