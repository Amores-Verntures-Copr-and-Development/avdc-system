import {
  getInventoryMovements,
  processStockBulkAdjustmetController,
} from "@/controllers/InventoryController";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inventoryId: string }> },
) {
  try {
    const slug = (await params).inventoryId;
    const inventoryId = Number(slug);
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const type = searchParams.get("type") || "";
    // const limit = searchParams.get("limit") || "";
    // const page = searchParams.get("page") || "";
    const category = searchParams.get("category") || "";
    // const limitNumber = Number(limit) || 100;
    // const pageNumber = Number(page) || 1;
    const res = await getInventoryMovements({
      keyFields: { inventoryId },
      search,
      from,
      to,
      type,
      category,
    });

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
      { status: 201 },
    );
  } catch (err: any) {
    console.log("Err: ", err);
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

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ inventoryId: string }> },
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
      { status: 201 },
    );
  } catch (err: any) {
    console.log("Err: ", err);
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
