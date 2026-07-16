import { resolveInventoryDuplicatesController } from "@/controllers/InventoryController";
import { InventoryReferenceType } from "@/types/inventory";
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

    const body = await req
      .json()
      .catch(() => ({}) as {
        inventoryItemReferenceType?: InventoryReferenceType;
        inventoryItemReferenceId?: number;
      });

    const res = await resolveInventoryDuplicatesController({
      inventoryId: Number(inventoryId),
      inventoryItemReferenceType: body.inventoryItemReferenceType,
      inventoryItemReferenceId: body.inventoryItemReferenceId,
    });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        data: res.data,
        message: res.message,
      },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e.message ?? "Failed to remove duplicate items!",
      },
      { status: 400 },
    );
  }
}
