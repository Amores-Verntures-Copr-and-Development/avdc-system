import { adjustReceivedController } from "@/controllers/PurchaseOrderController";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<PurchaseOrderItems> & {
      poCreatedBy: number;
    };
    console.log({ body });
    const res = await adjustReceivedController(body);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message);
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
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
