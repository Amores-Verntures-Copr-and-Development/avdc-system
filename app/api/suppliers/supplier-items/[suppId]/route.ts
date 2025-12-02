import {
  addItemSupplier,
  getSupplierItemById,
  updateSupplierItems,
} from "@/controllers/SupplierController";
import { CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { SupplierItem } from "@/types/supplier";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ suppId: string }> }
) {
  try {
    const slug = (await params).suppId;
    const suppId = Number(slug);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    // const status = searchParams.get("status") || "";
    // const category = searchParams.get("category") || "";
    // const unit = searchParams.get("unit") || "";
    const res = await getSupplierItemById({ suppId, search });
    console.log({ search });
    if (!res.success) {
      console.log(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 }
    );
  } catch (err: any) {
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

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreateSupplierItemDto;

    const res = await addItemSupplier(data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to add item in supplier");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add item in supplier",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data, controller } = await request.json();

    const res = await updateSupplierItems({ data, controller });
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to add item in supplier");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add item in supplier",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
