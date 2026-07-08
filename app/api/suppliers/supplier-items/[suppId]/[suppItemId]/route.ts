import {
  getSupplierItemPrices,
  updateSupplierItems,
} from "@/controllers/SupplierController";
import { SupplierItem } from "@/types/supplier";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ suppId: string; suppItemId: string }> },
) {
  try {
    const suppId = (await params).suppId;
    if (!suppId) {
      throw new Error("No suppId found!");
    }
    const suppItemId = (await params).suppItemId;

    const res = await getSupplierItemPrices({
      keyfields: { suppItemId: Number(suppItemId) },
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ suppId: string; suppItemId: string }> },
) {
  const data = (await request.json()) as SupplierItem;
  try {
    const suppId = (await params).suppId;
    if (!suppId) {
      throw new Error("No suppId found!");
    }
    const suppItemId = (await params).suppItemId;
    if (!suppItemId) {
      throw new Error("No suppItemId found!");
    }
    const res = await updateSupplierItems({
      controller: "price",
      data: [data],
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
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
