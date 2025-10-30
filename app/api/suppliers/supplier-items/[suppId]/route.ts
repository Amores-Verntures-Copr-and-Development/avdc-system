import {
  addItemSupplier,
  getSupplierItemById,
} from "@/controllers/SupplierController";
import { CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ suppId: number }> }
) {
  try {
    const slug = (await params).suppId;
    const suppId = Number(slug);
    const res = await getSupplierItemById(suppId);

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
