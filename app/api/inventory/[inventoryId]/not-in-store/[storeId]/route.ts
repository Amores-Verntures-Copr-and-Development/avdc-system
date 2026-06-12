import { getInventoryNotInStoreController } from "@/controllers/InventoryController";
import { count } from "console";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ inventoryId: string; storeId: string }> },
) {
  try {
    const { inventoryId, storeId } = await params;

    if (!inventoryId) {
      throw new Error("No inventory ID found!");
    }
    if (!storeId) {
      throw new Error("No store ID found!");
    }
    const res = await getInventoryNotInStoreController({
      inventoryId: Number(inventoryId),
      storeId: Number(storeId),
    });
    if (!res.success) {
      throw new Error(res.message);
    }
    return NextResponse.json(
      {
        success: true,
        data: res.data,
        message: "Good",
        count: res.count,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch!",
      },
      {
        status: 500,
      },
    );
  }
}
