import { resetPasswordController } from "@/controllers/CustomerPasswordResetController";
import { ResetPasswordDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as ResetPasswordDto;

    if (!data.email || !data.code || !data.newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, code, and new password are required.",
        },
        { status: 400 },
      );
    }

    const res = await resetPasswordController(data);
    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 400 },
      );
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
        message: "Failed to reset password",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
