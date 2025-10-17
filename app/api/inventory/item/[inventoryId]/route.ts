import { CreateFirstItem } from "@/dtos/inventory.dto";
import {
  addItemToInventory,
  getInventory,
  getInventoryItems,
} from "@/controllers/InventoryController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inventoryId: string }> }
) {
  try {
    const slug = (await params).inventoryId;
    const inventoryId = Number(slug);
    const res = await getInventoryItems(inventoryId);

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const data = (await request.json()) as CreateFirstItem;
    console.log("CreateFirstItem: ", data);
    const res = await addItemToInventory(data);

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
      throw new Error(res.message || "Failed to create store");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Store added successfully!",
        // data: res, // could sanitize before returning
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/auth/users error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Store add failed!",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
