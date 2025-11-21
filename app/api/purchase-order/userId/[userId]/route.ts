import { getPurchaseOrderByUserId } from "@/controllers/PurchaseOrderController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const slug1 = (await params).userId;
    const userId = Number(slug1);
    const res = await getPurchaseOrderByUserId(userId);

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
      { status: 201 }
    );
  } catch (err: any) {
    console.log("Err: ", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched!",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
