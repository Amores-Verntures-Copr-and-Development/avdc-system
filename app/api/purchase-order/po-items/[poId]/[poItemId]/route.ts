import {
  updatePurchaseOrderItemByPOId,
  updatePurchaserOrderById,
} from "@/controllers/PurchaseOrderController";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string; poItemId: string }> },
) {
  try {
    const poItemData = (await request.json()) as Partial<PurchaseOrderItems>;

    const slug = (await params).poId;
    const slug2 = (await params).poItemId;
    const poId = Number(slug);
    const poItemId = Number(slug2);
    if (!poId) {
      throw new Error("No poId found!");
    }
    if (!poItemId) {
      throw new Error("No poItemId found!");
    }
    const res = await updatePurchaserOrderById(poItemData);
    if (!res.success) {
      throw new Error(res.message || "Failed to Update PO item");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update PO item",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string; poItemId: string }> },
) {
  try {
    const poItemData = (await request.json()) as Partial<PurchaseOrderItems>[];

    const slug = (await params).poId;
    const slug2 = (await params).poItemId;
    const poId = Number(slug);
    const poItemId = Number(slug2);
    if (!poId) {
      throw new Error("No poId found!");
    }
    if (!poItemId) {
      throw new Error("No poItemId found!");
    }
    const res = await updatePurchaseOrderItemByPOId(poId, poItemData, "delete");
    if (!res.success) {
      throw new Error(res.message || "Failed to Update PO item");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update PO item",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
