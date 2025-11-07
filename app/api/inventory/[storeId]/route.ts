import { AddItemToStoreDto } from "@/app/inventory/InventoryPage";
import {
  addItemToStoreInventory,
  getInventory,
} from "@/controllers/InventoryController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const res = await getInventory({ storeId });
    if (!res.success) {
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
    const slug = (await params).storeId;
    const storeId = Number(slug);
    if (!storeId) {
      return NextResponse.json(
        {
          success: false,
          message: "No storeId found!",
        },
        { status: 500 }
      );
    }
    const data = (await request.json()) as AddItemToStoreDto;

    const res = await addItemToStoreInventory(data);

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
      throw new Error(res.message || "Failed to create store");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Store added successfully!",
        data: res, // could sanitize before returning
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
