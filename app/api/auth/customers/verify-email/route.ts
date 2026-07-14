import { verifyCustomerEmailController } from "@/controllers/CustomerEmailVerificationController";
import { VerifyCustomerEmailDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as VerifyCustomerEmailDto;

    const res = await verifyCustomerEmailController(data);
    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify email",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
