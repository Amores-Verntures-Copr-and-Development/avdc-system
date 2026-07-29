import { requestPasswordResetController } from "@/controllers/CustomerPasswordResetController";
import { RequestPasswordResetDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as RequestPasswordResetDto;

    if (!data.email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 },
      );
    }

    const res = await requestPasswordResetController(data);

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process password reset request",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
