import { replacePurchaseOrderitems } from "@/controllers/PurchaseOrderController";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string; poItemId: string }> },
) {
  try {
    const slug = (await params).poId;
    const slug1 = (await params).poItemId;
    const poId = Number(slug);
    const poItemId = Number(slug1);
    const token = request.cookies.get("avdc_accessToken")?.value;

    if (!token) throw new Error("No token found in cookies");

    console.log("Token:", token);

    if (!poId) {
      throw new Error("No poId found!");
    }
    if (!poItemId) {
      throw new Error("No PO ITEM found!");
    }

    const { from, to, replacedBy } = await request.json();

    const res = await replacePurchaseOrderitems({ from, to, replacedBy });
    if (!res.success) {
      throw new Error(res.message || "Failed to Add PO item");
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
