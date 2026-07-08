import {
  getInventoryMovements,
  processStockAdjustmetController,
} from "@/controllers/InventoryController";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { NextResponse } from "next/server";

export async function PUT(
  _request: Request,
  {
    params,
  }: { params: Promise<{ inventoryItemId: string; inventoryId: string }> },
) {
  try {
    const slug = (await params).inventoryItemId;
    const slug1 = (await params).inventoryId;
    const inventoryItemId = Number(slug1);
    const inventoryId = Number(slug);
    if (!inventoryId) {
      throw new Error("No inventory item found!");
    }
    if (!inventoryItemId) {
      throw new Error("No inventoryItemId item found!");
    }
    const data = (await _request.json()) as CreateInventoryMovementDto;
    const res = await processStockAdjustmetController(data);

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.result, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ inventoryId: string; inventoryItemId: string }> },
) {
  try {
    const slug = (await params).inventoryId;
    const inventoryId = Number(slug);
    const slug1 = (await params).inventoryItemId;
    const inventoryItemId = Number(slug1);
    const res = await getInventoryMovements({
      keyFields: { inventoryId, inventoryItemId },
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
