import { getPOByPORFields } from "@/controllers/PurchaseOrderController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const slug = (await params).requestId;
    console.log("Agi diri sa get");
    const res = await getPOByPORFields({
      keyfields: { requestId: Number(slug) },
    });

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
