import {
  createPurchaseOrderItemByPOId,
  getPurchaseOrderItemById,
  updatePurchaseOrderItem,
  updatePurchaseOrderItemByPoId,
} from "@/controllers/PurchaseOrderController";
import { CreatePurchaseOrderItemDto } from "@/dtos/purchase.dto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ poId: string }> }
) {
  try {
    const slug = (await params).poId;
    const poId = Number(slug);
    const res = await getPurchaseOrderItemById(poId);

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  try {
    const po = await request.json();
    const { data, controller } = po;
    const slug = (await params).poId;
    const poId = Number(slug);
    if (!poId) {
      throw new Error("No poId found!");
    }
    const res = await updatePurchaseOrderItem(controller, data);
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  try {
    const poItemData = (await request.json()) as CreatePurchaseOrderItemDto[];

    const slug = (await params).poId;
    const poId = Number(slug);
    if (!poId) {
      throw new Error("No poId found!");
    }
    const res = await createPurchaseOrderItemByPOId(poItemData);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to Add PO item");
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
