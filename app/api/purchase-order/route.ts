import {
  createPurchaseOrder,
  getPurchaseOrder,
  updateApprovedPurchaseOrder,
  updatePurchaseOrder,
} from "@/controllers/PurchaseOrderController";
import {
  CreatePurchaseOrderFormDto,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreatePurchaseOrderFormDto;

    const res = await createPurchaseOrder(data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to create purchase order");
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
        message: "Failed to create purchase order",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const res = await getPurchaseOrder();
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to fetch PO");
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
        message: "Failed to fetch PO",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const po = await request.json();
    const { data, controller } = po;
    const res = await updatePurchaseOrder(controller, data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to Update PO");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch PO",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
