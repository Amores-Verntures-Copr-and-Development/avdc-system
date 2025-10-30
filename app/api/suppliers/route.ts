import { addSupplier, getSupplier } from "@/controllers/SupplierController";
import { CreatePurchaseOrderFormDto } from "@/dtos/purchase.dto";
import { CreateSupplierDto } from "@/dtos/supplier.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreateSupplierDto;

    const res = await addSupplier(data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to add supplier");
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
        message: "Failed to add supplier",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const res = await getSupplier({});

    if (!res.success) {
      console.log(res.message);
      throw new Error(res.message);
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
    return NextResponse.json(
      {
        success: false,
        message: err?.message,
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
