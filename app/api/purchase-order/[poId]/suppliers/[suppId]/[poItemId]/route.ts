import { updateSupplierItemsFromPOItems } from "@/controllers/SupplierController";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ suppId: string; poId: string; poItemId: string }> },
) {
  const slug1 = (await params).poId;
  const poId = Number(slug1);
  const slug2 = (await params).suppId;
  const suppId = Number(slug2);
  const slug3 = (await params).poItemId;
  const poItemId = Number(slug3);
  const req = await request.json();
  console.log({ req });
  const { supplierItemPrice, poItem, isUpdateItem } = req;

  if (!poId) {
    new Error("No PO ID is found!");
  }
  if (!suppId) {
    new Error("No supplier ID is found!");
  }
  if (!poItemId) {
    new Error("No PO Item ID is found!");
  }

  try {
    const res = await updateSupplierItemsFromPOItems({
      supplierItemPrice: supplierItemPrice,
      poItem: poItem,
      isUpdateItem: isUpdateItem,
    });
    if (!res.success) {
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
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message || String(e),
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}
