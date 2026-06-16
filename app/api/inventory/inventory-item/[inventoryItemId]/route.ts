import { getInventoryItemByFileds } from "@/controllers/InventoryController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ inventoryItemId: string }> },
) {
  try {
    const { inventoryItemId } = await params;

    const res = await getInventoryItemByFileds({
      keyFields: { inventoryItemId: Number(inventoryItemId) },
    });

    if (!res.success) {
      throw new Error("Failed to fetch!");
    }
    return NextResponse.json(
      {
        success: true,
        data: res.data,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e,
      },
      { status: 400 },
    );
  }
}
