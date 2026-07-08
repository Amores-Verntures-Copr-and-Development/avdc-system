import { updateItemOrInventory } from "@/controllers/InventoryController";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  {
    params,
  }: { params: Promise<{ inventoryId: string; inventoryItemId: string }> },
) {
  try {
    const { inventoryItemData, itemData } = await request.json();

    const slug1 = (await params).inventoryId;
    const inventoryId = Number(slug1);
    const slug2 = (await params).inventoryItemId;
    const inventoryItemIderId = Number(slug2);
    if (!inventoryId) {
      throw new Error("No inventory Id Found!");
    }
    if (!inventoryItemIderId) {
      throw new Error("No inventoyr item Id Found!");
    }

    const res = await updateItemOrInventory({
      inventoryData: [inventoryItemData],
      itemData: [itemData],
    });
    if (!res.success) {
      throw new Error(res.message || "Failed to update item");
    }

    return NextResponse.json(
      {
        success: true,
        message: "res.message",
        // data: res, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update item",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
