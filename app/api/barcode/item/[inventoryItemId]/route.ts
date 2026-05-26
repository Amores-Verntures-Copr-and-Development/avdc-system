import { getBarcodeController } from "@/controllers/BarcodeController";
import { NextResponse } from "next/server";
import { createBarcodeController } from "@/controllers/BarcodeController";
import { CreateBarcodeDto } from "@/dtos/barcode.dto";
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBarcodeDto;

    const res = await createBarcodeController({ data: [body] });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message,
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
