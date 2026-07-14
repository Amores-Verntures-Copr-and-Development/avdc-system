import { changeUserPasswordController } from "@/controllers/UserControllers";
import { ChangeUserPasswordDto } from "@/dtos/user.dto";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const userId = Number((await params).userId);

    const token = request.cookies.get("avdc_accessToken")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY!) as {
      userId: number;
    };

    if (decoded.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "You can only update your own account." },
        { status: 403 },
      );
    }

    const data = (await request.json()) as ChangeUserPasswordDto;

    if (!data.currentPassword || !data.newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password and new password are required.",
        },
        { status: 400 },
      );
    }

    if (data.newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 8 characters.",
        },
        { status: 400 },
      );
    }

    const res = await changeUserPasswordController({ userId, data });
    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to change password",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
