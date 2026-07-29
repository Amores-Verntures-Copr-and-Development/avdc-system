import { verifyPasswordResetController } from "@/controllers/CustomerPasswordResetController";
import { VerifyPasswordResetDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as VerifyPasswordResetDto;

    if (!data.email || !data.code) {
      return NextResponse.json(
        { success: false, message: "Email and code are required." },
        { status: 400 },
      );
    }

    const res = await verifyPasswordResetController(data);
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
        message: "Failed to verify code",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
