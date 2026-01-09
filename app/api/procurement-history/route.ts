import { getProcurementHistory } from "@/controllers/PurchaseOrderController";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await getProcurementHistory();
    if (!res.success) {
      throw new Error(res.message || "Failed to fetch Procurement History");
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
        message: "Failed to fetch Prourement History",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
