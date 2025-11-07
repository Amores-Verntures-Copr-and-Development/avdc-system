import { deliverItemToStore } from "@/controllers/PurchaseOrderController";
import { DeliverItemsToStore } from "@/dtos/purchase.dto";
import { NextResponse } from "next/server";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    if (!storeId) {
      throw new Error("No store Id found!");
    }
    const data = (await _request.json()) as DeliverItemsToStore;
    const res = await deliverItemToStore(data);

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.result, // could sanitize before returning
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process deliver!",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
