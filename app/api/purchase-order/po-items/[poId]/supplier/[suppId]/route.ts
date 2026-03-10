import { createPurchaseOrderItemByPOIAndSupplier } from "@/controllers/PurchaseOrderController";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string; suppId: string }> },
) {
  try {
    const formData = await request.json();
    const { data, poId, secondSubmit, continueInsert } = formData;

    const slug = (await params).poId;
    const poIdSlug = Number(slug);
    const slug1 = (await params).suppId;
    const suppIdSlug = Number(slug1);

    if (!poIdSlug) {
      throw new Error("No poId found!");
    }
    if (!suppIdSlug) {
      throw new Error("No supplier id found!");
    }
    const res = await createPurchaseOrderItemByPOIAndSupplier({
      data,
      poId,
      secondSubmit,
      continueInsert,
    });
    if (!res.success) {
      throw new Error(res.message || "Failed to Add PO item");
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
        message: "Failed to fetch PO",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
