import {
  getInventoryMovements,
  processStockBulkAdjustmetController,
} from "@/controllers/InventoryController";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inventoryId: string }> }
) {
  try {
    const slug = (await params).inventoryId;
    const inventoryId = Number(slug);
    const res = await getInventoryMovements({ keyFields: { inventoryId } });

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.log("Err: ", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ inventoryId: string }> }
) {
  try {
    const slug1 = (await params).inventoryId;
    const inventoryId = Number(slug1);
    if (!inventoryId) {
      throw new Error("No inventory item found!");
    }

    const data = (await _request.json()) as CreateInventoryMovementDto[];
    const res = await processStockBulkAdjustmetController(data);

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.result, // could sanitize before returning
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.log("Err: ", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
