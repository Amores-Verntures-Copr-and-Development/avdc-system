import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { addAllItemFromStoreToInventoryController } from "@/controllers/InventoryController";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inventoryId: string; storeId: string }> },
) {
  try {
    const { inventoryId, storeId } = await params;

    const user = getCurrentUser(req);
    if (!inventoryId) {
      throw new Error("No inventory ID found!");
    }
    if (!storeId) {
      throw new Error("No store ID found!");
    }

    const res = await addAllItemFromStoreToInventoryController({
      userId: user.userId,
      inventoryId: Number(inventoryId),
      storeId: Number(storeId),
    });
    if (!res.success) {
      throw new Error(res.message);
    }
    return NextResponse.json(
      {
        success: true,
        message: "All items from store added to your inventory successfully!",
      },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add all store items to you inventory!",
      },
      { status: 400 },
    );
  }
}
