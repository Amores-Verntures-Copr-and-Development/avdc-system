import { CreateSaleDto } from "@/dtos/sales.dto";
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

    const receipt = body.items;

    if (!receipt) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    console.log(receipt.payments);
    const createSales: CreateSaleDto = {
      storeId: 0, // map Loyverse store_id to your local storeId
      salesCreatedBy: 0, // map employee_id later
      salesInvoice: receipt.receipt_number ?? "",
      salesNo: receipt.order ?? "",
      salesRemarks: receipt.note ?? "",
      salesStatus: SalesStatus.COMPLETED,

      salesSubTotal:
        Number(receipt.total_money ?? 0) + Number(receipt.total_discount ?? 0),
      salesTotalAmount: Number(receipt.total_money ?? 0),
      salesTotalPaid: Number(receipt.total_money ?? 0),

      saleDiscounts: receipt.total_discounts ?? [],

      salesItems: (receipt.line_items ?? []).map((item: any) => ({
        itemId: 0, // map Loyverse item/variant id to your local itemId
        quantity: Number(item.quantity ?? 0),
        price: Number(item.price ?? 0),
        total: Number(item.total_money ?? 0),
        discount: Number(item.total_discount ?? 0),
      })),

      salesPayments: (receipt.payments ?? []).map((payment: any) => ({
        paymentMethodId: 0, // map Loyverse payment name/type to your local paymentMethodId
        amount: Number(payment.money_amount ?? 0),
        referenceNo: payment.payment_id ?? "",
      })),

      customerId: 0, // map customer_id later
    };

    console.log("Mapped sale:", createSales);

    // await createSale(createSales);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Loyverse webhook error:", error);

    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
