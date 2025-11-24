import { CreateFirstItem } from "@/dtos/inventory.dto";
import {
  addItemToInventory,
  getInventoryItems,
} from "@/controllers/InventoryController";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ inventoryId: string }> }
) {
  try {
    const slug = (await params).inventoryId;
    const inventoryId = Number(slug);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const unit = searchParams.get("unit") || "";
    const res = await getInventoryItems({
      keyFields: { inventoryId: inventoryId },
      search,
      status,
      category,
      unit,
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

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as CreateFirstItem;

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
