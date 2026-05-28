import { deleteBarcodeByFields } from "@/controllers/BarcodeController";
import { deleteBarcode } from "@/services/barcode/delete-barcode";
import { Barcodes } from "@/types/barcode";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ barcodeId: string }> },
) {
  const body = (await request.json()) as Partial<Barcodes>;

  try {
    const res = await deleteBarcodeByFields({
      keyFields: ["barcodeId"],
      updates: [body],
    });

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
