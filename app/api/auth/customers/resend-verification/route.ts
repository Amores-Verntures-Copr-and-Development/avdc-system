import { resendCustomerVerificationController } from "@/controllers/CustomerEmailVerificationController";
import { ResendCustomerVerificationDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as ResendCustomerVerificationDto;

    const res = await resendCustomerVerificationController(data);
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
        message: "Failed to resend verification code",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
