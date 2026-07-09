import { CreateSaleDto } from "@/dtos/sales.dto";
import { processCreateSalesLoyverse } from "@/services/integration/loyverse/sales/process-create-sales-loyverse";
import { SalesStatus } from "@/types/sales";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Loyverse webhook endpoint is running. Use POST for webhook events.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Loyverse webhook:", body);

    const receipt = body.receipts;

    if (!receipt) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    await processCreateSalesLoyverse({ receipt: receipt[0] });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
