import { getStorePOItemsSupplierById } from "@/controllers/PurchaseOrderController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ suppId: string; poId: string }> },
) {
  try {
    const slug1 = (await params).poId;
    const poId = Number(slug1);
    const slug2 = (await params).suppId;
    const suppId = Number(slug2);
    const res = await getStorePOItemsSupplierById(poId, suppId);

    if (!res.success) {
      // propagate the actual message if available
      console.error(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.log("Err: ", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
