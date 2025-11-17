import { getInventory } from "@/controllers/InventoryController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ purchaserId: string }> }
) {
  try {
    const slug = (await params).purchaserId;
    const purchaserId = Number(slug);
    const res = await getInventory({
      controller: "stockPurchaser",
      keySpFields: { userId: purchaserId },
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
