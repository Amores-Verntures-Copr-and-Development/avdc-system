import {
  addItemsSupplier,
  addItemSupplier,
  addSupplier,
} from "@/controllers/SupplierController";
import { CreateSupplierDto, CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreateSupplierItemDto[];

    const res = await addItemsSupplier(data);
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
