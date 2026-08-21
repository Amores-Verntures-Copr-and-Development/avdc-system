import { getInventoryNotInStoreController } from "@/controllers/InventoryController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
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

    const actingUser = getCurrentUser(req);
    await assertStoreAccess(actingUser, Number(storeId));

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;
    const res = await getInventoryNotInStoreController({
      inventoryId: Number(inventoryId),
      storeId: Number(storeId),
      limit: limitNumber,
      skip: (pageNumber - 1) * limitNumber,
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
