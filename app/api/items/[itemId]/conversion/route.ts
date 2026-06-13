import {
  convertInventoryItems,
  createItemConversions,
  getItemConversions,
} from "@/controllers/ItemController";
import { ConvertInventoryItemsDto } from "@/dtos/inventory.dto";
import { CreateItemConversionDto } from "@/dtos/items.dto";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const slug = (await params).itemId;

    if (!slug) {
      throw new Error("No item ID found!");
    }
    const data = (await _request.json()) as CreateItemConversionDto;

    const res = await createItemConversions({ data });

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Items imported successfully!",
        result: res,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Items import failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const slug = (await params).itemId;

    if (!slug) {
      throw new Error("No item ID found!");
    }

    const res = await getItemConversions({
      keyFields: { fromItemId: Number(slug) },
    });

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
      throw new Error(res.message);
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
        message: "Items import failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const slug = (await params).itemId;
    const data = (await _request.json()) as ConvertInventoryItemsDto;

    if (!slug) {
      throw new Error("No item ID found!");
    }
    if (!data) {
      throw new Error("No data found!");
    }
    const res = await convertInventoryItems({
      data,
    });

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
      throw new Error(res.message);
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
        message: "Items import failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
