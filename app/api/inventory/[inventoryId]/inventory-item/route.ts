import { createInventoryItemController } from "@/controllers/InventoryController";
import { CreateInventoryItemDto } from "@/dtos/inventory.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inventoryId: string }> },
) {
  try {
    const { inventoryId } = await params;
    if (!inventoryId) {
      throw new Error("No inventory ID found!");
    }
    const body = (await req.json()) as CreateInventoryItemDto;
    const res = await createInventoryItemController(body);

    if (!res.success) {
      throw new Error(res.message);
    }
    return NextResponse.json(
      {
        success: true,
        message: "Item added to inventory successfully!",
      },
      { status: 201 },
    );
  } catch (e: any) {
    console.log({ e });
    return NextResponse.json(
      {
        success: false,
        message: e.message,
      },
      { status: 400 },
    );
  }
}
