import { updatePurchaseOrder } from "@/controllers/PurchaseOrderController";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string }> },
) {
  try {
    const slug = (await params).poId;
    const poId = Number(slug);
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
