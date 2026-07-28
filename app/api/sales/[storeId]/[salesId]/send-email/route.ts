import { sendSalesReceiptEmailController } from "@/controllers/SaleController";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string; salesId: string }> },
) {
  try {
    const slug = (await params).salesId;
    const salesId = Number(slug);

    if (!salesId) {
      throw new Error("No sales id found");
    }

    const res = await sendSalesReceiptEmailController({ salesId });
    console.log({ res });
    if (!res.success) {
      return NextResponse.json(
        {
          success: false,
          message: res.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
      },
      { status: 200 },
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
