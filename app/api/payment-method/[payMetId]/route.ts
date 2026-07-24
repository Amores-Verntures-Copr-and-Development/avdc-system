import { updatePaymentMethod } from "@/controllers/PaymentMethodController";
import { UpdatePaymentMethodDto } from "@/dtos/paymentMethods.dto";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ payMetId: string }> },
) {
  try {
    const { payMetId } = await params;

    if (!payMetId) {
      throw new Error("No payment method found");
    }

    const body = (await request.json()) as Omit<
      UpdatePaymentMethodDto,
      "payMetId"
    >;

    const data: UpdatePaymentMethodDto = {
      ...body,
      payMetId: Number(payMetId),
    };

    const res = await updatePaymentMethod(data);

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
