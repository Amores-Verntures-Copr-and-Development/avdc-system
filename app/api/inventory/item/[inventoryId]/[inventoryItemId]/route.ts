import { updateInventoryItem } from "@/controllers/InventoryController";
import { InventoryItemInterface } from "@/types/inventory";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  {
    params,
  }: { params: Promise<{ inventoryId: string; inventoryItemId: string }> }
) {
  try {
    const data = (await request.json()) as InventoryItemInterface;

    const slug1 = (await params).inventoryId;
    const inventoryId = Number(slug1);
    const slug2 = (await params).inventoryItemId;
    const purchasinventoryItemIderId = Number(slug2);
    const res = await updateInventoryItem(data);
    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
      throw new Error(res.message || "Failed to update item");
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        // data: res, // could sanitize before returning
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update item",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
