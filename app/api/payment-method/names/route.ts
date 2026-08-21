import { getUniquePaymentMethodNames } from "@/controllers/PaymentMethodController";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await getUniquePaymentMethodNames();

    if (!res.success) {
      throw new Error(`${res.error}`);
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
        message: "Failed to fetch payment method names!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
