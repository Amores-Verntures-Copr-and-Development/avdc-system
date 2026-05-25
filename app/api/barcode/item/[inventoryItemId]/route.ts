import { getBarcodeController } from "@/controllers/BarcodeController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inventoryItemId: string }> },
) {
  try {
    const { inventoryItemId } = await params;

    const res = await getBarcodeController({
      keyFields: { inventoryItemId: Number(inventoryItemId) },
    });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched products!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
